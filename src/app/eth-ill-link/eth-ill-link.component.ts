// If a CDI resource has the status “no_inventory”, 
// and if nothing is available via Rapido
// -> an ILL link is displayed.
// https://jira.ethz.ch/browse/SLSP-1986

import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, combineLatest, timer } from 'rxjs';
import { catchError, defaultIfEmpty, filter, map, shareReplay, switchMap, take } from 'rxjs/operators';
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
  private document = inject(DOCUMENT);
  private ethStoreService = inject(EthStoreService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private translate = inject(TranslateService);

  // do we need an ILL link? In this case: create the querystring of the ILL link.
  // 991076219509705501
  qs$: Observable<string | null> = combineLatest([
    this.ethStoreService.getFullDisplayRecord$(),
    this.ethStoreService.getFullDisplayDeliveryEntity$()
  ]).pipe(
    switchMap(([record, deliveryEntity]) => this.getIllQsOrNull(record, deliveryEntity)),
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

      // "GetIt from Other" exists → no ILL
      /*if (this.document.querySelector('nde-get-it-from-other')) {
        return of(null);
      }*/

      // Rapido already has "no offer"
      if (this.document.querySelector('[data-qa="rapido.tiles.noOfferTileLine1"]') || this.document.querySelector('[data-qa="rapido.tiles.articleFromJournalLine2"]')) {
        return of(this.buildQs(record));
      }

      // Poll only the Rapido state for ten seconds.
      return timer(100, 200).pipe(
        take(50),
        map(() =>
          this.document.querySelector('[data-qa="rapido.tiles.noOfferTileLine1"]') ??
          this.document.querySelector('[data-qa="rapido.tiles.articleFromJournalLine2"]')
        ),
        filter((rapidoState): rapidoState is Element => rapidoState !== null),
        take(1),
        map(() => this.buildQs(record)),
        defaultIfEmpty(null)
      );
    } catch (error) {
        this.ethErrorHandlingService.logError(error, 'EthIllLinkComponent.getIllQsOrNull()');
        return of(null);
    }

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
        qsParts.push(`${field}=${encodeURIComponent(val)}`);
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