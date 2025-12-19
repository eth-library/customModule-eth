// A DNB service is used to check whether there is a digitized table of contents and a link to it is displayed (if we do not yet have a TOC).
// https://jira.ethz.ch/browse/SLSP-1988

import { Component , Input } from '@angular/core';
import { Observable, catchError, debounceTime, distinctUntilChanged, filter, forkJoin, map, of, shareReplay, switchMap, tap } from 'rxjs';
import { EthDnbTocService } from './eth-dnb-toc.service'
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { TranslateService } from "@ngx-translate/core";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';


// 991029346049705501
@Component({
  selector: 'custom-eth-dnb-toc',
  templateUrl: './eth-dnb-toc.component.html',
  styleUrls: ['./eth-dnb-toc.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]     
})
export class EthDnbTocComponent {
  contentLinks$!: Observable<{ almaLinks: any[]; dnbLinks: any[] }>;
  
  @Input() hostComponent: any = {};
  
  constructor(
    private ethDnbTocService: EthDnbTocService,
    private translate: TranslateService,
    private ethStoreService:EthStoreService,     
    private ethErrorHandlingService: EthErrorHandlingService
  ){}


  // 9783715550527
  // 990042614440205503 - multiple Links (Sämtliche Werke in zehn Bänden)
  ngOnInit() {
    this.contentLinks$ = this.ethStoreService.isFullview$().pipe(
      filter(Boolean),
      switchMap(() => this.ethStoreService.getFullDisplayDeliveryEntity$()),
      distinctUntilChanged(),
      map((deliveryEntity: any) => {
        let aExclude = ['http://doi.org/10.3932/','https://tma.e-pics.ethz.ch/','https://vls.hsa.ethz.ch', 'http://hdl.handle.net','http://dx.doi.org/10.7891/e-manuscripta','https://wayback.archive-It.org/','https://vls.mfa.ethz.ch/','https://vls.tma.ethz.ch/','doi.org/10.24448', 'doi.org/10.3931/e-rara-','doi.org/10.5169/seals-'];
        //console.error(deliveryEntity?.delivery?.link)
        const almaLinks = deliveryEntity?.delivery?.link?.filter( (link: any) => {
          return ['linktorsrc', 'addlink'].includes(link.linkType) && link.displayLabel !== '$$Elinktorsrc' && !aExclude.some(excludeStr => link.linkURL?.includes(excludeStr));
        }) ?? [];
        //console.error("almaLinks", almaLinks)
        return almaLinks.map((l: any) => ({
          identifier: null,
          uri: l.linkURL,
          type: 'alma',
          label: l.displayLabel
        }));
      }),
      switchMap(almaLinks =>
        almaLinks.length > 0
          ? of({ almaLinks, dnbLinks: [] })
          : this.ethStoreService.getFullDisplayRecord$().pipe(
              distinctUntilChanged(),
              switchMap((record: any) => this.getDnbLinks(record)),
              map((dnbLinks: any[] | null) => {
                if (!Array.isArray(dnbLinks)) {
                  return [];
                }
                const seen = new Set<string>();
                return dnbLinks.filter(link => {
                  if (!link?.uri) return false;
                  if (seen.has(link.uri)) return false;
                  seen.add(link.uri);
                  return true;
                });
              }),
              map(dnbLinks => {
                  return ({ almaLinks: [], dnbLinks })
                }
              )
            )
      )
    );
  }

  private getDnbLinks(record: any): Observable<any[] | null> {    
    const isbns = this.getIsbns(record);
    const title = this.getTitle(record);

    if (!isbns?.length) {
      return of([]);
    }

    const labelToc$ = this.translate.stream('eth.dnbToc.toc');
    const labelText$ = this.translate.stream('eth.dnbToc.text');

    return forkJoin(
      isbns.map(isbn => {
        return this.ethDnbTocService.getTocLink(isbn).pipe(
          catchError(error => {
            this.ethErrorHandlingService.handleError(error, 'EthDnbTocComponent');
            return of(null);
          })
        )}
      )
    ).pipe(
      map(entities => entities ? entities.filter(entity => entity?.links?.length > 0) : []),
      map(entities => {
        return entities.flatMap(entity =>
          entity.links.map((link: any) => {
            let label$;
            if (link.partOfResource === 'Inhaltsverzeichnis') {
              label$ = labelToc$;
            } else if (link.partOfResource === 'Inhaltstext') {
              label$ = labelText$;
            } else {
              label$ = of(link.partOfResource);
            }

            return {
              identifier: entity.identifier,
              uri: link.uri,
              type: 'dnb',
              label$: label$,
              title:
                link.title.normalize('NFC').trim() === title.normalize('NFC').trim()
                  ? null
                  : link.title
                      .normalize('NFC')
                      .replace(//g, '')
                      .replace(//g, '')
                      .trim()
            };
          })
        );
      }),
      //tap(links => console.error('TOC Links:', links))
    )
  }

  private getIsbns(record: any): string[] | null {
    return record?.pnx?.addata?.isbn ?? [];
  }  

  private getTitle(record: any): string {
    return record?.pnx?.display?.title?.[0];
  }

}
