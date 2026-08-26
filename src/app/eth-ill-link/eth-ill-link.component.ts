// If user is loggedin
// and a CDI resource has the status “no_inventory”, 
// and there is no partOf
// and if nothing is available via Rapido
// -> an ILL link is displayed.
// cdi_globaltitleindex_catalog_562266386
// cdi_globaltitleindex_catalog_384431683
// 991170442160705501 : physicalPolicy exists

// https://jira.ethz.ch/browse/SLSP-1986

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { Observable, of, combineLatest } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, shareReplay, switchMap } from 'rxjs/operators';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { PnxDoc, StoreDeliveryEntity } from '../models/eth.model';

interface TranslationBundle {
  t1: string;
  t2: string;
  t3: string;
  linkText: string;
  newWindow: string;
}

@Component({
  selector: 'custom-eth-ill-link',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eth-ill-link.component.html',
  styleUrls: ['./eth-ill-link.component.scss']
})
export class EthIllLinkComponent {
  private ethStoreService = inject(EthStoreService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private translate = inject(TranslateService);
  private store = inject(Store);

  // do we need an ILL link? In this case: create the querystring of the ILL link (metadata for form).
  qs$: Observable<string | null> = this.ethStoreService.isLoggedIn$.pipe(
    switchMap(isLoggedIn =>
      isLoggedIn
        ? combineLatest([
            this.ethStoreService.getFullDisplayRecord$(),
            this.ethStoreService.getFullDisplayDeliveryEntity$()
          ]).pipe(
            switchMap(([record, deliveryEntity]) => this.getIllQsOrNull(record, deliveryEntity))
          )
        : of(null)
    ),
    catchError(err => {
      this.ethErrorHandlingService.logError(err, 'EthIllLinkComponent.qs$');
      return of(null);
    }),
    shareReplay({
      bufferSize: 1,
      refCount: true
    })
  );

  // get translations, if needed
  translations$: Observable<TranslationBundle | null> = this.qs$.pipe(
    switchMap(qs =>
      qs
        ? combineLatest([
            this.translate.stream('eth.illLink.text1'),
            this.translate.stream('eth.illLink.text2'),
            this.translate.stream('eth.illLink.text3'),
            this.translate.stream('eth.illLink.linkText'),
            this.translate.stream('nui.aria.newWindow')
          ]).pipe(
            map(([t1, t2, t3, linkText, newWindow]) => ({
              t1,
              t2,
              t3,
              linkText,
              newWindow
            }))
          )
        : of(null)
    ),
    catchError(err => {
      this.ethErrorHandlingService.logError(err, 'EthIllLinkComponent.translations$');
      return of(null);
    })
  );

  // build URL
  url$: Observable<string | null> = this.qs$.pipe(
    switchMap(qs =>
      qs
        ? this.translate.stream('eth.illLink.url').pipe(
            map(baseUrl => `${baseUrl}?${qs}`)
          )
        : of(null)
    ),
    catchError(err => {
      this.ethErrorHandlingService.logError(err, 'EthIllLinkComponent.url$');
      return of(null);
    })
  );

  // do we need an ILL link? If so, build querystring for ILL link
  private getIllQsOrNull(record: PnxDoc | null, deliveryEntity: StoreDeliveryEntity  | null): Observable<string | null> {
    try {
      if ((deliveryEntity?.delivery?.availability?.[0] ?? '') !== 'no_inventory') {
        return of(null);
      }
      // if ispartof (991076219509705501) return
      if(record?.pnx?.display?.ispartof?.length && record?.pnx?.display?.ispartof?.[0]){
        return of(null);
      }
      // "GetIt from Other" exists → no ILL
      /*if (this.document.querySelector('nde-get-it-from-other')) {
        return of(null);
      }*/

      // Wait for the Rapido offer data from the store, then build QS only if it has nothing to offer
      return this.getRapidoOfferState$().pipe(
        map(state => (state === 'noOffer' ? this.buildQs(record) : null))
      );
    } catch (error) {
        this.ethErrorHandlingService.logError(error, 'EthIllLinkComponent.getIllQsOrNull()');
        return of(null);
    }

  }

  // 'noOffer': no best policy resolved for digital/physical/ebook; 'hasOffer': at least one policy present
  // Stays subscribed (no take(1)) so later updates to rapidoOfferWrapper on the same record are picked up too.
  private getRapidoOfferState$(): Observable<'noOffer' | 'hasOffer'> {
    return this.store.pipe(
      map((state: any) => {
        const recordId = (state?.['full-display']?.selectedRecordId ?? '').replace(/^alma/, '').replace(/^cdi_/, '');
        const userGroup = state?.user?.decodedJwt?.userGroup ?? '';
        return state?.['ngrs-record-data']?.entities?.[`${userGroup}_${recordId}`];
      }),
      filter(entity => entity?.rapidoOffersStatus === 'success' && entity?.rapidoDigitalOffersStatus === 'success'),
      map(entity => {
        const rapidoOfferWrapper = entity.rapidoOfferWrapper ?? {};
        //console.error("rapidoOfferWrapper",rapidoOfferWrapper)
        const hasOffer = !!(rapidoOfferWrapper.bestDigitalPolicy || rapidoOfferWrapper.bestPhysicalPolicy || rapidoOfferWrapper.bestEbookPolicy);
        return hasOffer ? 'hasOffer' : 'noOffer';
      }),
      distinctUntilChanged()
    );
  }


  // build ILL link
  private buildQs(record: PnxDoc | null): string {
    try {    
      if (!record?.pnx) return '';

      const display = record.pnx.display;
      const addata = record.pnx.addata;

      const type = display?.type?.[0];

      const qsParts: string[] = [];

      const process = (field: string, value?: string | string[]) => {
        if (!value) return;
        const val = Array.isArray(value) ? value.join(', ') : value;
        let normalizedVal = val;
        try {
          normalizedVal = decodeURIComponent(val);
        } catch {
          // Keep raw values that are not valid URI components.
        }
        qsParts.push(`${field}=${encodeURIComponent(normalizedVal)}`);
      };

      if (type && ['article', 'magazinearticle', 'articles'].includes(type)) {
        process('atitle', addata?.atitle?.[0]);
        process('jtitle', addata?.jtitle?.[0]);
        process('au', addata?.au?.length ? addata.au : addata?.addau);
        process('volume', addata?.volume?.[0] || display?.ispartof?.[0]?.split('$$Q')?.[0]);
        process('pages', addata?.pages?.[0]);
        process('issn', addata?.issn);
        process('date', addata?.date?.[0]);
      } else if (type === 'book_chapter') {
        process('atitle', addata?.atitle?.[0]);
        process('jtitle', addata?.btitle?.[0]);
        process('au', addata?.au?.length ? addata.au : addata?.addau);
        process('volume', addata?.volume?.[0] || '-');
        process('pages', addata?.pages?.[0]);
        process('issn', addata?.isbn || addata?.eisbn);
        process('date', addata?.date?.[0]);
      } else {
        process('jtitle', display?.title?.[0]);
        process('au', display?.creator?.[0]);
        process('date', display?.creationdate?.[0]);
        process('publisher', display?.publisher?.[0]);

        const identifiers = display?.identifier?.filter(
          i => i.includes('ISSN') || i.includes('ISBN')
        );
        if (identifiers?.length) {
          process('issn', identifiers[0].substring(identifiers[0].indexOf(':') + 2));
        }
      }
      return qsParts.join('&');
    } catch (error) {
        this.ethErrorHandlingService.logError(error, 'EthIllLinkComponent.buildQs()');
        return '';
    }
  }

}