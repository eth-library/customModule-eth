// A DNB service is used to check whether there is a digitized table of contents and a link to it is displayed (if there is no Alma TOC link).
// https://jira.ethz.ch/browse/SLSP-1988

import { Component , Input } from '@angular/core';
import { Observable, catchError, combineLatest, defer, distinctUntilChanged, filter, forkJoin, map, of, switchMap } from 'rxjs';
import { EthDnbTocService } from './eth-dnb-toc.service'
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { TranslateService } from "@ngx-translate/core";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { HostComponent, PnxDoc, DnbTocApiResponse, DnbTocLinksVM, DnbTocDnbLinkVM } from '../../models/eth.model';

const EXCLUDED_ALMA_LINK_PREFIXES = [
  'http://doi.org/10.3932/',
  'https://tma.e-pics.ethz.ch/',
  'https://vls.hsa.ethz.ch',
  'http://hdl.handle.net',
  'http://dx.doi.org/10.7891/e-manuscripta',
  'https://wayback.archive-It.org/',
  'https://vls.mfa.ethz.ch/',
  'https://vls.tma.ethz.ch/',
  'doi.org/10.24448',
  'doi.org/10.3931/e-rara-',
  'doi.org/10.5169/seals-'
];

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
  @Input() hostComponent: HostComponent = {};

  readonly contentLinks$: Observable<DnbTocLinksVM | null> = defer(() =>
    this.ethStoreService.isFullview$().pipe(
      filter(Boolean),
      switchMap(() => this.ethStoreService.getFullDisplayDeliveryEntity$()),
      distinctUntilChanged(),
      map(deliveryEntity => this.mapAlmaLinks(deliveryEntity)),
      switchMap(almaLinks =>
        almaLinks.length > 0
          ? of({ almaLinks, dnbLinks: [] })
          : this.ethStoreService.getFullDisplayRecord$().pipe(
              distinctUntilChanged(),
              switchMap((record: PnxDoc | null) => this.getDnbLinks(record)),
              map(dnbLinks => this.dedupeLinks(dnbLinks)),
              map(dnbLinks => ({ almaLinks: [], dnbLinks }))
            )
      ),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthDnbTocComponent.contentLinks');
        return of(null);
      })
    )
  );
  
  constructor(
    private ethDnbTocService: EthDnbTocService,
    private translate: TranslateService,
    private ethStoreService:EthStoreService,     
    private ethErrorHandlingService: EthErrorHandlingService
  ){}


  private mapAlmaLinks(deliveryEntity: any): DnbTocLinksVM['almaLinks'] {
    const almaLinks = deliveryEntity?.delivery?.link?.filter((link: any) =>
      ['linktorsrc', 'addlink'].includes(link.linkType) &&
      link.displayLabel !== '$$Elinktorsrc' &&
      !EXCLUDED_ALMA_LINK_PREFIXES.some(excludeStr => link.linkURL?.includes(excludeStr))
    ) ?? [];

    return almaLinks.map((link: any) => ({
      identifier: null,
      uri: link.linkURL,
      type: 'alma',
      label: link.displayLabel
    }));
  }

  private dedupeLinks(dnbLinks: DnbTocDnbLinkVM[]): DnbTocDnbLinkVM[] {
    const seen = new Set<string>();
    return dnbLinks.filter(link => {
      if (!link?.uri) return false;
      if (seen.has(link.uri)) return false;
      seen.add(link.uri);
      return true;
    });
  }

  private getDnbLinks(record: PnxDoc | null): Observable<DnbTocDnbLinkVM[]> {    
    if (!record) {
      return of([]);
    }
    
    const isbns = this.getIsbns(record);
    const title = this.getTitle(record);

    if (!isbns?.length) {
      return of([]);
    }

    const labelToc$ = this.translate.stream('eth.dnbToc.toc');
    const labelText$ = this.translate.stream('eth.dnbToc.text');

    const entities$ = forkJoin(
      isbns.map(isbn =>
        this.ethDnbTocService.getTocLink(isbn).pipe( 
          map(response => ({
            identifier: response.identifier,
            links: (response.links ?? []).filter(link => !!link?.uri)
          })),
          catchError(error => {
            this.ethErrorHandlingService.logError(error, 'EthDnbTocComponent. getTocLink()');
            return of(null);
          })
        )
      )
    ).pipe(
      map(entities =>
        entities.filter(
          (e): e is DnbTocApiResponse =>
            !!e && Array.isArray(e.links) && e.links.length > 0
        )
      )
    );

    return combineLatest({
      entities: entities$,
      labelToc: labelToc$,
      labelText: labelText$
    }).pipe(
      map(({ entities, labelToc, labelText }) =>
        entities.flatMap(entity =>
          entity.links
            .filter(link => !!link?.uri)
            .map(link => {
              const part = link.partOfResource ?? '';

              const label =
                part === 'Inhaltsverzeichnis'
                  ? labelToc
                  : part === 'Inhaltstext'
                    ? labelText
                    : part;

              const normalizedTitle = link.title
                ? link.title
                    .normalize('NFC')
                    .replace(//g, '')
                    .replace(//g, '')
                    .trim()
                : null;

              return {
                identifier: entity.identifier,
                uri: link.uri!,
                type: 'dnb',
                label,
                title:
                  normalizedTitle &&
                  normalizedTitle === title.normalize('NFC').trim()
                    ? null
                    : normalizedTitle
              };
            })
        )
      )
    );

  }

  private getIsbns(record: PnxDoc): string[] | null {
    return record?.pnx?.addata?.isbn ?? [];
  }  

  private getTitle(record: PnxDoc): string {
    return record?.pnx?.display?.title?.[0] ?? '';
  }

}
