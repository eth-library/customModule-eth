import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, AfterViewInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, combineLatest, filter, map, Observable, of, switchMap, take, fromEventPattern, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

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
  imports: [
    CommonModule
  ],
  templateUrl: './eth-ill-link.component.html',
  styleUrls: ['./eth-ill-link.component.scss']
})
export class EthIllLinkComponent implements AfterViewInit {

  qs$!: Observable<string | null>;
  url$!: Observable<string | null>;
  translations$!: Observable<TranslationBundle>;

  constructor(
    private ethStoreService: EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  // 991076219509705501
  ngAfterViewInit() {
    this.url$ = this.ethStoreService.getFullDisplayRecord$().pipe(
      switchMap(record => {
        return this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
          switchMap(deliveryEntity => {
            if (deliveryEntity?.delivery?.availability[0] !== 'no_inventory') {
              return of(null);
            }
            // check GetIt from Other
            if(this.document.querySelector('nde-get-it-from-other')){
                return of(null);
            }
            if (this.document.querySelector('[data-qa="rapido.tiles.noOfferTileLine1"]')) {
                return of(this.buildQs(record));
            }            
            return new Observable<any>(observer => {
              const mo = new MutationObserver((_mutations, obs) => {
                const rapidoNoOffer = this.document.querySelector('[data-qa="rapido.tiles.noOfferTileLine1"]');
                if (rapidoNoOffer) {
                  obs.disconnect();
                  observer.next(this.buildQs(record));
                  observer.complete();
                }
              });
              mo.observe(this.document.body, { childList: true, subtree: true });
              return () => mo.disconnect();
            });
          })
        );
      }),
      switchMap(qs => {
        if (qs == null) return of(null);
        this.translations$ = combineLatest([
          this.translate.stream('eth.illLink.text1'),
          this.translate.stream('eth.illLink.text2'),
          this.translate.stream('eth.illLink.text3'),
          this.translate.stream('eth.illLink.linkText'),
          this.translate.stream('nui.aria.newWindow')
          ])
          .pipe(
              map(([t1, t2, t3, linkText, newWindow]) => ({ t1, t2, t3, linkText, newWindow }))
          );
        return this.translate.stream('eth.illLink.url').pipe(
            map(url => `${url}?${qs}`)
        );
      }),
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthIllLinkComponent');
        return of(null);
      })      
    )
  }

  
  buildQs(record: any): string {
    if (!record?.pnx) return '';

    const type = record.pnx.display?.type?.[0];
    const addata = record.pnx.addata || {};
    const display = record.pnx.display || {};

    const process = (field: string, value?: string | string[]) => {
      if (!value) return;
      const val = Array.isArray(value) ? value.join(', ') : value;
      qsParts.push(`${field}=${encodeURIComponent(val)}`);
    };

    const qsParts: string[] = [];

    if (['article', 'magazinearticle', 'articles'].includes(type)) {
      process('atitle', addata['atitle']?.[0]);
      process('jtitle', addata['jtitle']?.[0]);
      process('au', addata['au']?.length ? addata['au'] : addata['addau']);
      process('volume', addata['volume']?.[0] || display['ispartof']?.[0]?.split('$$Q')?.[0]);
      process('pages', addata['pages']?.[0]);
      process('issn', addata['issn']);
      process('date', addata['date']?.[0]);
    }
    else if (type === 'book_chapter') {
      process('atitle', addata['atitle']?.[0]);
      process('jtitle', addata['btitle']?.[0]);
      process('au', addata['au']?.length ? addata['au'] : addata['addau']);
      process('volume', addata['volume']?.[0] || '-');
      process('pages', addata['pages']?.[0]);
      process('issn', addata['isbn'] || addata['eisbn']);
      process('date', addata['date']?.[0]);
    }
    else {
      process('jtitle', display['title']?.[0]);
      process('au', display['creator']?.[0]);
      process('date', display['creationdate']?.[0]);
      process('publisher', display['publisher']?.[0]);
      const identifiers = display['identifier']?.filter((i: string) => i.includes('ISSN') || i.includes('ISBN'));
      if (identifiers?.length) process('issn', identifiers[0].substring(identifiers[0].indexOf(':') + 2));
    }
    
    return qsParts.join('&');
  }

}
