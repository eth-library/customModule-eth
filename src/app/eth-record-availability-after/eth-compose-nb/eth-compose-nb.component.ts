// The print and online resources of the TMA Nachlassbibliothek are linked.
// https://jira.ethz.ch/browse/SLSP-2003

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { defer, of, Observable } from 'rxjs';
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
export class EthComposeNbComponent {
  @Input() hostComponent: HostComponent = {};
  private router = inject(SHELL_ROUTER);   
  
  readonly links$: Observable<ComposeNbLinkVM[]> = defer(() =>
    this.ethStoreService.isFullview$().pipe(
      filter(Boolean),
      switchMap(() => this.ethStoreService.getFullDisplayRecord$()),
      distinctUntilChanged(),
      switchMap(record => this.getLinks(record)),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthComposeNbComponent.linksStream');
        return of([]);
      })
    )
  );

  constructor(
    private ethComposeNbService: EthComposeNbService,
    private ethStoreService: EthStoreService,
    private translate: TranslateService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  
  private getLinks(record: PnxDoc | null): Observable<ComposeNbLinkVM[]> {
    if (!record?.pnx) return of([]);
    const source = record.pnx.display?.source?.[0];

    // ONLINE -> PRINT
    if (source === 'eth_nachlassbibliothek') {
      return this.buildPrintLinks(record);
    }

    // PRINT -> ONLINE
    if (source === 'Alma') {
      return this.buildOnlineLinks(record);
    }

    return of([]);
  }

  private buildPrintLinks(record: PnxDoc): Observable<ComposeNbLinkVM[]> {
    const originalSourceId = record?.pnx?.control?.originalsourceid?.[0];
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

  private buildOnlineLinks(record: PnxDoc): Observable<ComposeNbLinkVM[]> {
    const oaiId = this.extractOaiId(record?.pnx?.display?.lds02 ?? []);
    if (!oaiId) return of([]);

    return this.ethComposeNbService.getOnlineData(oaiId).pipe(
      map(data => this.mapOnlineDocs(data?.docs ?? []))
    );
  }

  private extractOaiId(lds02: string[]): string | null {
    const raw = lds02
      .find(item => item.includes('(NEBIS)'))
      ?.replace('(NEBIS)', 'oai:agora.ch:')
      ?.replace(/EBI01$/, '');

    return raw ?? null;
  }

  private mapOnlineDocs(docs: Array<{ pnx?: PnxDoc['pnx'] }>): ComposeNbLinkVM[] {
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
      .filter((link): link is ComposeNbLinkVM => !!link);

    onlineLinks.sort((a, b) => this.extractBandNumber(a.sortKey) - this.extractBandNumber(b.sortKey));
    return onlineLinks;
  }

  private extractBandNumber(text: string): number {
    const match = text.match(/Band\s*(\d+)/i);
    return match ? Number(match[1]) : 0;
  }


  private makePrimoUrl(mmsid: string): string {
    const vid = this.ethStoreService.getVid() || '';
    const tab = this.ethStoreService.getTab() || '';
    const scope = this.ethStoreService.getScope() || '';
    return `/fulldisplay?vid=${vid}&docid=alma${mmsid}&tab=${tab}&search_scope=${scope}`;
  }

  navigate(url: string, event: Event) {
    event.preventDefault();
    this.router.navigateByUrl(url);
  }

}