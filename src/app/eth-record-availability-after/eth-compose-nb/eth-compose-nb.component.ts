import { Component, Input, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, Observable } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { EthComposeNbService } from './eth-compose-nb.service';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';

type Link = { label: string; url: string };

// oai:agora.ch:004261444_08 (oai:agora.ch:000280096) - 99118814985305503  -> multiple online/one print
// single result: 990044649040205503 --  oai:agora.ch:004464904
@Component({
  selector: 'custom-eth-compose-nb',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eth-compose-nb.component.html',
  styleUrls: ['./eth-compose-nb.component.scss']
})
export class EthComposeNbComponent implements AfterViewInit {
  @Input() hostComponent: any = {};

  links$!: Observable<Link[]>;

  constructor(
    private ethComposeNbService: EthComposeNbService,
    private ethStoreService: EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngAfterViewInit(): void {
    this.links$ = this.ethStoreService.isFullview$().pipe(
      filter(Boolean),
      switchMap(() => this.ethStoreService.getFullviewRecord$()),
      distinctUntilChanged(),
      switchMap(record => this.getLinks(record)),
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthComposeNbComponent.ngAfterViewInit');
        return of([]);
      })
    );
  }

  private getLinks(record: any): Observable<Link[]> {
    if (!record?.pnx) return of([]);

    const source = record.pnx.display?.source?.[0];
    const links: Link[] = [];

    const labelPrint = 'Print Item in in ETH-Bibliothek @ swisscovery';
    const labelOnline = 'Online Item in ETH-Bibliothek @ swisscovery';

    // online -> search print record
    // oai:agora.ch:004261444_08  - 99118814985305503  -> multiple online/one print
    if (source === 'eth_nachlassbibliothek') {
      const originalSourceId = record.pnx.control?.originalsourceid?.[0];
      if (!originalSourceId) return of([]);

      const baseId = originalSourceId.includes('_')
        ? originalSourceId.substring(0, originalSourceId.indexOf('_'))
        : originalSourceId;

      const nebisId = 'ebi01_prod' + baseId.substring(baseId.lastIndexOf(':') + 1);
      
      return this.ethComposeNbService.getPrintData(nebisId).pipe(
        map(data => {
          const printId = data?.map?.[0]?.almaSearch;
          //console.error("printId",printId)
          if (printId) {
            links.push({ label: labelPrint, url: this.makePrimoUrl(printId) });
          }
          return links;
        }),
        catchError(() => of([]))
      );
    }

    // print -> search online record 
    // multiple result 'Sämtliche Romane und Novellen Dostoevskij'
    // oai:agora.ch:004261444
    // single result: 990044649040205503
    if (source === 'Alma') {
      const lds02 = record.pnx?.display?.lds02 ?? [];
      // (NEBIS)004464904EBI01 -> oai:agora.ch:004464904
      const oaiIds = lds02
        .filter((i: string) => i.includes('(NEBIS)'))
        .map((i: string) => 'oai:agora.ch:' + i.substring(7, i.length - 5));

      if (!oaiIds.length) return of([]);
      let oaiId = oaiIds[0]; 

      return this.ethComposeNbService.getOnlineData(oaiId).pipe(
        map(data => {
          const docs = data?.docs ?? [];
          const onlineLinks = docs.map((d: any) => ({
            label: docs.length > 1
              ? `${labelOnline} ${d.pnx?.display?.title?.[0] ?? ''}`
              : labelOnline,
            url: this.makePrimoUrl(d.pnx?.control?.sourcerecordid?.[0])
          }));
          
          onlineLinks.sort((a: { label: string; url: string }, b: { label: string; url: string }) => {
            const extractBandNumber = (label: string) => {
              const match = label.match(/Band\s*(\d+)/i);
              return match ? parseInt(match[1], 10) : 0;
            };
            return extractBandNumber(a.label) - extractBandNumber(b.label);
          });
          return onlineLinks;
        }),
        catchError(() => of([]))
      );
    }

    return of([]);
  }

  private makePrimoUrl(mmsid: string): string {
    const vid = this.ethStoreService.getVid();
    const tab = this.ethStoreService.getTab();
    const scope = this.ethStoreService.getScope();
    return `/nde/fulldisplay?vid=${vid}&docid=alma${mmsid}&tab=${tab}&search_scope=${scope}`;
  }

}


/**
 *         label: {
            print:{
                de: 'Print-Exemplar in ETH-Bibliothek @ swisscovery',
                en: 'Print Item in in ETH-Bibliothek @ swisscovery'
            },
            online: {
                de: 'Online-Exemplar in ETH-Bibliothek @ swisscovery',
                en: 'Online Item in ETH-Bibliothek @ swisscovery'
            }
        }
 * 
 */