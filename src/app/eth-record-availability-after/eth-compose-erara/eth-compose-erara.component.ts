import { Component, Input, AfterViewInit, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of, forkJoin } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthComposeEraraService } from './eth-compose-erara.service';
import { TranslateService } from "@ngx-translate/core";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';

type Link = { 
  label: string;
  url: string;
  external: boolean;
};

@Component({
  selector: 'custom-eth-compose-erara',
  standalone: true,
  imports: [CommonModule, SafeTranslatePipe],
  templateUrl: './eth-compose-erara.component.html',
  styleUrls: ['./eth-compose-erara.component.scss']
})
export class EthComposeEraraComponent {
  @Input() hostComponent: any = {};

  links$!: Observable<Link[]>;

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


  private getLinks(record: any): Observable<Link[]> {
    
    if (!record?.pnx?.display?.mms?.[0]) {
      return of([]);
    }

    const mmsid = record.pnx.display.mms[0];
    const type = record.pnx.display.type?.[0];
    const sourceSystem = record.pnx.control.sourcesystem?.[0];
    const links: Link[] = [];

    const labelPrint = 'Print Item in ETH Library @ swisscovery';
    const labelOnline = 'Online Item in ETH Library @ swisscovery (from e-rara)';
    const labelEMap = 'Georeferenced online Item in ETH Library @ swisscovery (from e-maps)';
    const labelGeoTIFF = 'GeoTIFF map via e-maps';

    // check if this an emap record
    // if so: is there an erara record?
    if (type === 'map' && record.pnx.display.lds50?.some((i: string) => i.includes('E01emaps'))) {
      return this.ethComposeEraraService.getEraraRecordForEMap(mmsid).pipe(
        switchMap(eraraData => {
          const eraraPrintId = eraraData?.[0]?._fields?.[1];
          if (!eraraPrintId) return of([]);

          links.push({
            label: labelPrint,
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
                  label: labelOnline,
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
              const out: Link[] = [];
              const url = data?.[0]?._fields?.[1];
              //console.error("erara print; get emaps",url)
              if (url) out.push({ label: labelGeoTIFF, url, external: true });

              const onlineIdEMaps = data[0]._fields[0];
              //console.error("erara print; get swisscovery emaps",onlineIdEMaps)
              if (onlineIdEMaps) out.push({ label: labelEMap, url: this.makePrimoUrl(onlineIdEMaps),external: false });
              return out;
            }),
            catchError(() => of([]))            
          )
        : of([]);

      const onlineErara$ = this.ethComposeEraraService.getOnlineEraraRecord(mmsid).pipe(
        map(data => {
          const out: Link[] = [];
          const onlineId = data?.docs?.[0]?.pnx?.control?.sourcerecordid?.[0];
          //console.error("erara print; get erara online",onlineId)
          if (onlineId) out.push({ label: labelOnline, url: this.makePrimoUrl(onlineId), external: false });
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
        const printLink = { label: labelPrint, url: this.makePrimoUrl(printId), external: false  };
        //console.error("erara online; get erara print", printId)
        
        // check GeoTIFF
        if (type === 'map') {
          return this.ethComposeEraraService.getEMapsRecord(printId).pipe(
            map(data => {
              const links: Link[] = [];

              const emapsUrl = data?.[0]?._fields?.[1];
              if (emapsUrl) {
                links.push({ label:labelGeoTIFF, url:emapsUrl, external: true });
                //console.error("erara online; get emaps", emapsUrl)
              }

              const onlineIdEMaps = data[0]._fields[0];
              //console.error("erara online; get swisscovery emaps",onlineIdEMaps);
              if (onlineIdEMaps) links.push({ label:labelEMap, url:this.makePrimoUrl(onlineIdEMaps), external: false });

              // always add print link 
              links.push(printLink);
              return links;
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
    return `/nde/fulldisplay?vid=${vid}&docid=alma${mmsid}&tab=${tab}&search_scope=${scope}`;
  }
}

/*
  print:{
      de: 'Print-Exemplar in ETH-Bibliothek @ swisscovery',
      en: 'Print Item in ETH Library @ swisscovery'
  },
  online: {
      de: 'Online-Exemplar in ETH-Bibliothek @ swisscovery (e-rara)',
      en: 'Online Item in ETH Library @ swisscovery (e-rara)'
  },
  onlineEMap: {
      de: 'Georeferenziertes Online-Exemplar in ETH-Bibliothek @ swisscovery (e-maps)',
      en: 'Georeferenced online Item in ETH Library @ swisscovery (e-maps)'
  },
  onlineGeoTIFF: {
      de: 'GeoTIFF via e-maps',
      en: 'GeoTIFF via e-maps'
  }
*/