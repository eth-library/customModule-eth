import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject} from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { TranslateModule } from "@ngx-translate/core";


@Component({
  selector: 'custom-eth-ill-link',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './eth-ill-link.component.html',
  styleUrl: './eth-ill-link.component.scss'
})
export class EthIllLinkComponent {
  qs$!: Observable<string | null>;
  private observer?: MutationObserver;   

  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    @Inject(DOCUMENT) private document: Document    
  ){}

  ngAfterViewInit() {
    // Article: cdi_proquest_miscellaneous_2479421945
    this.qs$ = this.ethStoreService.getFullviewRecord$().pipe(
      switchMap(record => {
        /*const recordId = record?.pnx?.control?.['recordid']?.[0];
        if (recordId && recordId.indexOf('cdi_') === -1) {
          return of(null);
        }*/
        return this.ethStoreService.getDeliveryEntity$().pipe(
          switchMap(deliveryEntity => {
            if (deliveryEntity?.delivery?.availability[0] !== 'no_inventory') {
              return of(null);
            }
            // check GetIt from Other
            if(this.document.querySelector('nde-get-it-from-other')){
                return of(null);
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
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthIllLinkComponent');
        return of(null);
      })      
    );
  }

  buildQs(record: any){
    let aQs = [];
    // article
    if((record?.pnx?.display?.['type'][0] === 'magazinearticle' || record?.pnx?.display?.['type'][0] === 'article' || record?.pnx?.display?.['type'][0] === 'articles') && record?.pnx?.addata?.['atitle']){
        if(record?.pnx?.addata?.['atitle']?.[0]){
            aQs.push(
                'atitle=' + encodeURIComponent(record?.pnx?.addata?.['atitle'][0])
            );
        }
        if(record?.pnx?.addata?.['jtitle']?.[0]){
            aQs.push(
                'jtitle=' + encodeURIComponent(record?.pnx?.addata?.['jtitle'][0])
            );
        }
        if(record?.pnx?.addata?.['au']?.length > 0){
            aQs.push(
                'au=' + encodeURIComponent(record?.pnx?.addata?.['au'].join(', '))
            );
        }
        else if(record?.pnx?.addata?.['addau']?.length > 0){
            aQs.push(
                'au=' + encodeURIComponent(record?.pnx?.addata?.['addau'].join(', '))
            );
        }
        if(record?.pnx?.addata?.['volume']?.[0]){
            aQs.push(
                'volume=' + encodeURIComponent(record?.pnx?.addata?.['volume'][0])
            );
        }
        else if(record?.pnx?.display?.['ispartof']?.[0]){
            let ispartof = record?.pnx?.display?.['ispartof'][0];
            ispartof = ispartof.split('$$Q')[0];
            aQs.push(
                'volume=' + encodeURIComponent(ispartof)
            );
        }
        if(record?.pnx?.addata?.['pages']?.[0]){
            aQs.push(
                'pages=' + encodeURIComponent(record?.pnx?.addata?.['pages'][0])
            );
        }
        if(record?.pnx?.addata?.['issn']?.[0]){
            aQs.push(
                'issn=' + encodeURIComponent(record?.pnx?.addata?.['issn'].join(','))
            );
        }
        if(record?.pnx?.addata?.['date']?.[0]){
            aQs.push(
                'date=' + encodeURIComponent(record?.pnx?.addata?.['date'][0])
            );
        }
    }
    // book chapter
    else if(record?.pnx?.display?.['type'][0] === 'book_chapter' && record?.pnx?.addata?.['atitle']){
        if(record?.pnx?.addata?.['atitle']?.[0]){
            aQs.push(
                'atitle=' + encodeURIComponent(record?.pnx?.addata?.['atitle'][0])
            );
        }
        if(record?.pnx?.addata?.['btitle']?.[0]){
            aQs.push(
                'jtitle=' + encodeURIComponent(record?.pnx?.addata?.['btitle'][0])
            );
        }
        if(record?.pnx?.addata?.['au']?.length > 0){
            aQs.push(
                'au=' + encodeURIComponent(record?.pnx?.addata?.['au'].join(', '))
            );
        }
        else if(record?.pnx?.addata?.['addau']?.length > 0){
            aQs.push(
                'au=' + encodeURIComponent(record?.pnx?.addata?.['addau'].join(', '))
            );
        }
        if(record?.pnx?.addata?.['pages']?.[0]){
            aQs.push(
                'pages=' + encodeURIComponent(record?.pnx?.addata?.['pages'][0])
            );
        }
        if(record?.pnx?.addata?.['volume']?.[0]){
            aQs.push(
                'volume=' + encodeURIComponent(record?.pnx?.addata?.['volume'][0])
            );
        }
        else {
            aQs.push(
                'volume=-'
            );
        }
        if(record?.pnx?.addata?.['isbn']?.[0]){
            aQs.push(
                'issn=' + encodeURIComponent(record?.pnx?.addata?.['isbn'].join(','))
            );
        }
        else if(record?.pnx?.addata?.['eisbn']?.[0]){
            aQs.push(
                'issn=' + encodeURIComponent(record?.pnx?.addata?.['eisbn'].join(','))
            );
        }
        if(record?.pnx?.addata?.['date']?.[0]){
            aQs.push(
                'date=' + encodeURIComponent(record?.pnx?.addata?.['date'][0])
            );
        }
    }
    else{
        if(record?.pnx?.display?.['title']?.[0]){
            aQs.push(
                'jtitle=' + encodeURIComponent(record?.pnx?.display?.['title'][0])
            );
        }
        if(record?.pnx?.display?.['creator']?.[0]){
            aQs.push(
                'au=' + encodeURIComponent(record?.pnx?.display?.['creator'][0])
            );
        }
        if(record?.pnx?.display?.['creationdate']?.[0]){
            aQs.push(
                'date=' + encodeURIComponent(record?.pnx?.display?.['creationdate'][0])
            );
        }
        if(record?.pnx?.display?.['publisher']?.[0]){
            aQs.push(
                'publisher=' + encodeURIComponent(record?.pnx?.display?.['publisher']?.[0])
            );
        }
        if(record?.pnx?.display?.['identifier']){
            let aIdent = record?.pnx?.display?.['identifier'].filter((i:any) => {
                return i.indexOf('ISSN')>-1 || i.indexOf('ISBN')>-1;
            })
            if(aIdent.length > 0){
                aQs.push(
                    'issn=' + encodeURIComponent(aIdent[0].substring(aIdent[0].indexOf(':')+2))
                );
            }
        }
    }
    return aQs.join('&');
  }

}

/*
            let digitalCondition = false;
            let physicalCondition = false;

            let noOfferDigital = document.querySelector('[translate="rapido.tiles.no.offer.after.placeholder.digital"]');
            if(noOfferDigital){
                digitalCondition = true;
            }

            let buttonPhysical = document.getElementById('get_it_btn_physical');
            if(!buttonPhysical || buttonPhysical.getAttribute('disabled')){
                physicalCondition = true;
            }

            if(digitalCondition && physicalCondition){
                let aQs = [];
                ....
                this.qs = '?' + aQs.join('&');
                this.isIllLink = true;
            }
            this.processDoCheck = false;
        }
        catch(e){
            console.error("***ETH*** an error occured: ethIllLinkController $doCheck\n\n");
            console.error(e.message);
        }
    }
}
      text1:{
          de: 'Artikel/Kapitel ist im swisscovery Network nicht vorhanden oder nicht bestellbar.',
          en: 'Article/chapter is not held in the swisscovery Network or cannot be requested.'
      },
      text2:{
          de: 'Bestellen Sie bitte via',
          en: 'Please request via'
      },
      linktext:{
          de: 'Fernleihe',
          en: 'interlibrary loan'
      },
      text3:{
          de: '.',
          en: '.'
      },
  },
  url:{
      link: {
          de: 'https://library.ethz.ch/recherchieren-und-nutzen/ausleihen-und-nutzen/bestellformulare/fernleihe-kopien-bestellen.html',
          en: 'https://library.ethz.ch/en/searching-and-using/borrowing-and-using/order-forms/interlibrary-loans-ordering-copies.html'
      }
  }
    
*/