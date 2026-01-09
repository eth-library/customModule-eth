// If CDI resources have the status “no_inventory”, if there is no nde-get-it-from-other and if nothing is available via Rapido, an ILL link is displayed.
// https://jira.ethz.ch/browse/SLSP-1986

import { CommonModule, DOCUMENT } from '@angular/common';
import { OnInit, Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of, combineLatest } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { EthStoreService } from 'src/app/services/eth-store.service';
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
export class EthIllLinkComponent implements OnInit {

  qs$!: Observable<string | null>;
  url$!: Observable<string | null>;
  translations$!: Observable<TranslationBundle | null>;

  constructor(
    private ethStoreService: EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    // do we need an ILL link? In this case: create the querystring of the ILL link. 
    this.qs$ = combineLatest([
      this.ethStoreService.getFullDisplayRecord$(),
      this.ethStoreService.getFullDisplayDeliveryEntity$()
    ]).pipe(
      switchMap(([record, deliveryEntity]) =>
        this.getQs(record, deliveryEntity)
      ),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthIllLinkComponent.ngOnInit()');
        return of(null);
      }),
      shareReplay({
        bufferSize: 1,
        refCount: true
      })
    );

    /**
     * get translations, if needed
     */
    this.translations$ = this.qs$.pipe(
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
      )
    );

    // build URL
    this.url$ = this.qs$.pipe(
      switchMap(qs =>
        qs
          ? this.translate.stream('eth.illLink.url').pipe(
              map(baseUrl => `${baseUrl}?${qs}`)
            )
          : of(null)
      )
    );
  }

  // do we need an ILL link?
  private getQs(record: PnxDoc | null, deliveryEntity: StoreDeliveryEntity  | null): Observable<string | null> {

    if ((deliveryEntity?.delivery?.availability?.[0] ?? '') !== 'no_inventory') {
      return of(null);
    }

    // GetIt from Other exists → no ILL
    if (this.document.querySelector('nde-get-it-from-other')) {
      return of(null);
    }

    // Rapido already has "no offer"
    if (this.document.querySelector('[data-qa="rapido.tiles.noOfferTileLine1"]')) {
      return of(this.buildQs(record));
    }

    // wait for rapido
    return new Observable<string>(observer => {
      const mo = new MutationObserver(() => {
        const rapidoNoOffer = this.document.querySelector(
          '[data-qa="rapido.tiles.noOfferTileLine1"]'
        );
        if (rapidoNoOffer) {
          mo.disconnect();
          observer.next(this.buildQs(record));
          observer.complete();
        }
      });

      mo.observe(this.document.body, { childList: true, subtree: true });

      return () => mo.disconnect();
    });
  }

  // build ILL link
  private buildQs(record: PnxDoc | null): string {
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
  }

}
