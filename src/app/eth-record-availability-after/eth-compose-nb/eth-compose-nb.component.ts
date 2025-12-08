import { Component, Input, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, Observable } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, switchMap } from 'rxjs/operators';
import { EthComposeNbService } from './eth-compose-nb.service';
import { EthStoreService } from '../../services/eth-store.service';
import { TranslateService } from "@ngx-translate/core";
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { SHELL_ROUTER } from "../../injection-tokens";

type Link = {
    label$: Observable<string | null>;
    label: string; 
    url: string;
};

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
  private router = inject(SHELL_ROUTER);   
  
  links$!: Observable<Link[]>;

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
        this.ethErrorHandlingService.handleError(error, 'EthComposeNbComponent.ngAfterViewInit');
        return of([]);
      })
    );
  }

  private getLinks(record: any): Observable<Link[]> {
    if (!record?.pnx) return of([]);

    const source = record.pnx.display?.source?.[0];
    const links: Link[] = [];

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
          if (printId) {
            links.push({ label$: this.translate.stream('eth.composeNb.print'),  label: this.translate.instant('eth.composeNb.print'), url: this.makePrimoUrl(printId) });
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
          if(docs.length === 0) return of([]);

          const labelOnline = this.translate.instant('eth.composeNb.online'); // synchrone label
          const labelOnline$ = this.translate.stream('eth.composeNb.online'); // async stream

          const onlineLinks = docs.map((d: any) => {
            const title = d.pnx?.display?.title?.[0] ?? '';
            const baseLabel = docs.length > 1 ? `${labelOnline} - ${title}` : labelOnline;

            return {
              label: baseLabel,
              label$: docs.length > 1 
                ? labelOnline$.pipe(map(v => `${v} - ${title}`))
                : labelOnline$,
              url: this.makePrimoUrl(d.pnx?.control?.sourcerecordid?.[0])
            };
          });

          const extractBandNumber = (label: string) => {
            const match = label.match(/Band\s*(\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          };

          onlineLinks.sort((a:any, b:any) =>
            extractBandNumber(a.label) - extractBandNumber(b.label)
          );

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
    return `/fulldisplay?vid=${vid}&docid=alma${mmsid}&tab=${tab}&search_scope=${scope}`;
  }

  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }    

}