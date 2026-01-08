// Resources from e-rara are linked reciprocally with their prints and possibly with e-maps.
// https://jira.ethz.ch/browse/SLSP-2002

import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, filter, map, switchMap } from 'rxjs/operators';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthComposeEraraService } from './eth-compose-erara.service';
import { TranslateService } from "@ngx-translate/core";
import { SHELL_ROUTER } from "../../injection-tokens";
import { HostComponent, ComposeEraraLinkVM, Doc } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-compose-erara',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eth-compose-erara.component.html',
  styleUrls: ['./eth-compose-erara.component.scss']
})
export class EthComposeEraraComponent {
  @Input() hostComponent: HostComponent = {};
  private router = inject(SHELL_ROUTER);   
  
  labelPrint$!: Observable<string | null>;
  labelOnline$!: Observable<string | null>;
  labelEMap$!: Observable<string | null>;
  labelGeoTIFF$!: Observable<string | null>;
  labelNewWindow$!: Observable<string | null>;
  links$!: Observable<ComposeEraraLinkVM[]>;


  constructor(
    private ethComposeEraraService: EthComposeEraraService,
    private ethStoreService: EthStoreService,
    private translate: TranslateService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  // Online: 99117338116605503
  // Print: 990042488650205503
  // e-maps: 99117999030205503


  ngAfterViewInit(): void {
    this.links$ = this.ethStoreService.isFullview$().pipe(
      filter(Boolean),
      switchMap(() => this.ethStoreService.getFullDisplayRecord$()),
      switchMap(record => this.getLinks(record)),
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthComposeEraraComponent.ngAfterViewInit');
        return of([]);
      })
    );
  }


  private getLinks(record: Doc | null): Observable<ComposeEraraLinkVM[]> {
    
    if (!record?.pnx?.display?.mms?.[0]) {
      return of([]);
    }

    const mmsid = record.pnx.display.mms[0];
    const type = record.pnx.display.type?.[0];
    const sourceSystem = record.pnx?.control?.sourcesystem?.[0];
    const links: ComposeEraraLinkVM[] = [];

    this.labelPrint$ = this.translate.stream('eth.composeErara.print')  as Observable<string>;
    this.labelOnline$ = this.translate.stream('eth.composeErara.online') as Observable<string>;
    this.labelEMap$ = this.translate.stream('eth.composeErara.emaps') as Observable<string>;
    this.labelGeoTIFF$ = this.translate.stream('eth.composeErara.geoTiff') as Observable<string>;
    this.labelNewWindow$ = this.translate.stream('nui.aria.newWindow') as Observable<string>;
    

    // check if this an emap record
    // if so: is there an erara record?
    if (type === 'map' && record.pnx.display.lds50?.some((i: string) => i.includes('E01emaps'))) {
      return this.ethComposeEraraService.getEraraRecordForEMap(mmsid).pipe(
        switchMap(eraraData => {
          const eraraPrintId = eraraData?.[0]?._fields?.[1];
          if (!eraraPrintId) return of([]);

          links.push({
            label$: this.labelPrint$ as Observable<string>,
            url: this.makePrimoUrl(eraraPrintId),
            external: false
          });

          return this.ethComposeEraraService.getOnlineEraraRecord(eraraPrintId).pipe(
            map(record => {
              //console.error("record",record)
              const onlineId = record?.docs?.[0]?.pnx?.control?.sourcerecordid?.[0];
              //console.error("emaps record; get online erara:", onlineId)
              if (onlineId) {
                links.push({
                  label$: this.labelOnline$ as Observable<string>,
                  url: this.makePrimoUrl(onlineId),
                  external: false
                });
              }
              return links;
            })
          );
        })
      );
    }

    // check if this is a print erara record
    // if so: is there an emaps record and an online erara record?
    if (sourceSystem === 'ILS' && mmsid.endsWith('5503')) {
      const emaps$ = type === 'map'
        ? this.ethComposeEraraService.getEMapsRecord(mmsid).pipe(
            map(data => {
              const out: ComposeEraraLinkVM[] = [];
              const url = data?.[0]?._fields?.[1];
              //console.error("erara print; get emaps",url)
              if (url) out.push({ label$: this.labelGeoTIFF$ as Observable<string>, url, external: true });

              const onlineIdEMaps = data?.[0]._fields[0];
              //console.error("erara print; get swisscovery emaps",onlineIdEMaps)
              if (onlineIdEMaps) out.push({ label$: this.labelEMap$ as Observable<string>, url: this.makePrimoUrl(onlineIdEMaps),external: false });
              return out;
            }),
            catchError(() => of([]))            
          )
        : of([]);

      const onlineErara$ = this.ethComposeEraraService.getOnlineEraraRecord(mmsid).pipe(
        map(data => {
          const out: ComposeEraraLinkVM[] = [];
          const onlineId = data?.docs?.[0]?.pnx?.control?.sourcerecordid?.[0];
          //console.error("erara print; get erara online",onlineId)
          if (onlineId) out.push({ label$: this.labelOnline$ as Observable<string>, url: this.makePrimoUrl(onlineId), external: false });
          return out;
        }),
        catchError(() => of([]))        
      );

      return forkJoin([emaps$, onlineErara$]).pipe(
        map(([emapsLinks, onlineLinks]) => [...emapsLinks, ...onlineLinks])
      );
    }

    // check if this is a digital erara record 
    // if so: is there an print erara record and an emaps record?
    if (sourceSystem === 'Other' && record.pnx.display.lds09) {
      const printIds = record.pnx.display.lds09
        .filter((i: string) => i.includes('MMS_ID_PRINT_') && i.endsWith('5503'))
        .map((i: string) => i.substring(i.indexOf('MMS_ID_PRINT_') + 13));

      if (printIds.length) {
        const printId = printIds[0];
        const printLink = { label$: this.labelPrint$ as Observable<string>, url: this.makePrimoUrl(printId), external: false  };
        //console.error("erara online; get erara print", printId)
        
        // check GeoTIFF
        if (type === 'map') {
          return this.ethComposeEraraService.getEMapsRecord(printId).pipe(
            map(data => {
              const out: ComposeEraraLinkVM[] = [];
              const emapsUrl = data?.[0]?._fields?.[1];
              if (emapsUrl) {
                out.push({ label$: this.labelGeoTIFF$ as Observable<string>, url:emapsUrl, external: true });
                //console.error("erara online; get emaps", emapsUrl)
              }

              const onlineIdEMaps = data?.[0]._fields[0];
              //console.error("erara online; get swisscovery emaps",onlineIdEMaps);
              if (onlineIdEMaps) out.push({ label$: this.labelEMap$ as Observable<string>, url:this.makePrimoUrl(onlineIdEMaps), external: false });

              // always add print link 
              out.push(printLink);
              return out;
            }),
            catchError(error => {
              return of([printLink]);
            })
          );
        }
        return of([printLink]);
      }
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

/*
  print:{
      de: 'Print-Exemplar in ETH swisscovery',
      en: 'Print Item in ETH swisscovery'
  },
  online: {
      de: 'Online-Exemplar in ETH swisscovery (e-rara)',
      en: 'Online Item in ETH swisscovery (e-rara)'
  },
  onlineEMap: {
      de: 'Georeferenziertes Online-Exemplar in ETH swisscovery (e-maps)',
      en: 'Georeferenced online Item in ETH swisscovery (e-maps)'
  },
  onlineGeoTIFF: {
      de: 'GeoTIFF via e-maps',
      en: 'GeoTIFF via e-maps'
  }
*/