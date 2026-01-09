// The print and online resources of the TMA Nachlassbibliothek are linked.
// https://jira.ethz.ch/browse/SLSP-2003

import { Component, Input, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, Observable } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { EthComposeNbService } from './eth-compose-nb.service';
import { EthStoreService } from '../../services/eth-store.service';
import { TranslateService } from "@ngx-translate/core";
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { SHELL_ROUTER } from "../../injection-tokens";
import { HostComponent, ComposeNbLinkVM, PnxDoc } from '../../models/eth.model';

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
  @Input() hostComponent: HostComponent = {};
  private router = inject(SHELL_ROUTER);   
  
  links$!: Observable<ComposeNbLinkVM[]>;

  constructor(
    private ethComposeNbService: EthComposeNbService,
    private ethStoreService: EthStoreService,
    private translate: TranslateService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngAfterViewInit(): void {
    this.links$ = this.ethStoreService.isFullview$().pipe(
      filter(Boolean),
      switchMap(() => this.ethStoreService.getFullDisplayRecord$()),
      distinctUntilChanged(),
      switchMap(record => this.getLinks(record)),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthComposeNbComponent.ngAfterViewInit');
        return of([]);
      })
    );
  }

  private getLinks(record: PnxDoc | null): Observable<ComposeNbLinkVM[]> {
    if (!record?.pnx) return of([]);
    const source = record.pnx.display?.source?.[0];

    // ONLINE → PRINT
    if (source === 'eth_nachlassbibliothek') {
      const originalSourceId = record.pnx.control?.originalsourceid?.[0];
      if (!originalSourceId) return of([]);

      const baseId = originalSourceId.split('_')[0];
      const nebisId = 'ebi01_prod' + baseId.substring(baseId.lastIndexOf(':') + 1);

      return this.ethComposeNbService.getPrintData(nebisId).pipe(
        map(data => {
          const printId = data?.map?.[0]?.almaSearch;
          if (!printId) return [];

          return [{
            url: this.makePrimoUrl(printId),
            sortKey: 'Print',
            label$: this.translate.stream('eth.composeNb.print')
          }];
        })
      );
    }

    // PRINT → ONLINE
    if (source === 'Alma') {
      const lds02 = record.pnx.display?.lds02 ?? [];

      const oaiId = lds02
        .find((i: string) => i.includes('(NEBIS)'))
        ?.replace('(NEBIS)', 'oai:agora.ch:')
        ?.replace(/EBI01$/, '');

      if (!oaiId) return of([]);

      return of(oaiId).pipe(
        distinctUntilChanged(),

        switchMap(oaiId =>
          this.ethComposeNbService.getOnlineData(oaiId).pipe(
            map(data => {
              const docs = data?.docs ?? [];
              if (docs.length === 0) return [];

              const label$ = this.translate.stream('eth.composeNb.online');

              const onlineLinks: ComposeNbLinkVM[] = docs
                .map(d => {
                  const mmsId = d.pnx?.control?.sourcerecordid?.[0];
                  if (!mmsId) return null;

                  const title = d.pnx?.display?.title?.[0] ?? '';

                  return {
                    url: this.makePrimoUrl(mmsId),
                    sortKey: title,
                    label$: docs.length > 1
                      ? label$.pipe(map(v => `${v} - ${title}`))
                      : label$
                  };
                })
                .filter((l): l is ComposeNbLinkVM => !!l);

              const extractBandNumber = (text: string): number => {
                const match = text.match(/Band\s*(\d+)/i);
                return match ? Number(match[1]) : 0;
              };

              onlineLinks.sort(
                (a, b) =>
                  extractBandNumber(a.sortKey) - extractBandNumber(b.sortKey)
              );

              return onlineLinks;
            })
          )
        )
      );
    }


    return of([]);
  }


  private makePrimoUrl(mmsid: string): string {
    const vid = this.ethStoreService.getVid() || '';
    const tab = this.ethStoreService.getTab() || '';
    const scope = this.ethStoreService.getScope() || '';
    return `/fulldisplay?vid=${vid}&docid=alma${mmsid}&tab=${tab}&search_scope=${scope}`;
  }

  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }    

}