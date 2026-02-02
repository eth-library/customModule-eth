// If a resource is assigned to one or more locations/POIs (based on the geodata graph) and the location is assigned to Wikipedia, the corresponding location pages are linked in right sidebar.
// https://jira.ethz.ch/browse/SLSP-2004

import { Component, inject, Input } from '@angular/core';
import { EthGeoRefService } from './eth-geo-ref.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
//import { EthMatomoService } from '../../eth-matomo/eth-matomo.service';
import { SHELL_ROUTER } from "../../injection-tokens";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { HostComponent, PnxDoc, PlacesGeoRefVM, PlaceGeoRefVM, GraphRelatedPlacesResponse, GraphGndPlacesResponse, EthoramaAPIResponse, EnrichedPoiAPIResponse } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-geo-ref',
  templateUrl: './eth-geo-ref.component.html',
  styleUrls: ['./eth-geo-ref.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule,
    SafeTranslatePipe
  ]     
})
export class EthGeoRefComponent {
  private router = inject(SHELL_ROUTER);
  @Input() hostComponent: HostComponent = {};
  places$!: Observable<PlacesGeoRefVM | null>;
  //private mqListener: ((e: MediaQueryListEvent) => void) | null = null;
  openGnd: string | null = null;  
  
  lang!: string | null;
  tab!:  string | null;
  scope!:  string | null;
  vid!:  string | null;
  
  constructor(
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethGeoRefService: EthGeoRefService,
    private ethStoreService:EthStoreService,     
    private translate: TranslateService,
    //private matomoService: EthMatomoService    
  ) {}

  ngOnInit() {
    this.places$ = this.ethStoreService.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getPlaces(record)),
      /*tap( (places) => {
        if (places.ethorama.length > 0 && !this.cardPositioned) {
          this.cardPositioned = true;
          this.mqListener = this.ethUtilsService.positionCard(
            '.eth-place-cards'
          );
        }
      }),*/
      catchError(err => {
        this.ethErrorHandlingService.logError( err, 'EthGeoRefComponent.ngOnInit');
        return of(null);      
      })
    )
  }

  getPlaces(record: PnxDoc): Observable<PlacesGeoRefVM> { 
    try {
      this.lang = this.translate.currentLang;
      this.vid = this.ethStoreService.getVid() || '';
      this.tab = this.ethStoreService.getTab() || '';
      this.scope = this.ethStoreService.getScope() || '';

      const docId = this.getSourceRecordId(record);
      const gndIds = this.getGndIds(record);   
      const gndPlaces$ = gndIds?.length
        ? this.ethGeoRefService.getGndPlacesFromGraph(gndIds.join(',')).pipe(
            map(data => this.mapGndPlacesToVm(data)),
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.getGndPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);

      const emapsPlaces$ = this.isEmaps(record) && docId
        ? this.ethGeoRefService.getEmapsRelatedPlacesFromGraph(docId).pipe(
            map(data => this.mapGraphPlacesToVm(data)),
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.getEmapsRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);


        //const eraraPlaces$ = this.getSourceSystem(record) === 'ILS' && docId && docId.endsWith('5503')
        const eraraPlaces$ = docId && docId.endsWith('5503')
        ? this.ethGeoRefService.getEraraRelatedPlacesFromGraph(docId).pipe(
            map(data => this.mapGraphPlacesToVm(data)),
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.getEraraRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);


      const ethorama$ = docId 
        ? this.ethGeoRefService.getPlacesFromETHorama(docId).pipe(
            switchMap((data: EthoramaAPIResponse) => {
              return data?.items?.length ? this.ethGeoRefService.enrichPOIs(data.items) : of<EnrichedPoiAPIResponse[]>([])
            }),
            map((enrichedPois: EnrichedPoiAPIResponse[]) => {
              const uniquePois = new Map();
              enrichedPois.forEach(p => {
                const key = p.qid ?? p.lccn;
                if (!key || uniquePois.has(key)) return;    
                uniquePois.set(p.qid, {
                  id: p.id,
                  qid: p.qid,
                  lccn: p.lccn,
                  gnd: p.gnd,
                  thumbnail: p.thumbnail,
                  label: p.name,
                  description: p.descriptionWikidata,
                  url: this.buildLocationEntityUrl(p.gnd, p.qid, p.lccn)!
                });
              });
              return Array.from(uniquePois.values()).sort((a,b) => a.label.localeCompare(b.label));
            }),
            catchError(error => {
              // no item found -> http 500
              return of([]); 
            })
          )
        : of([]);
      
        
        return forkJoin([gndPlaces$, ethorama$, emapsPlaces$, eraraPlaces$]).pipe(
          map(([gndPlaces, ethorama, emapsPlaces, eraraPlaces]) => ({
            gndPlaces,
            ethorama,
            emapsPlaces,
            eraraPlaces,
            allPlaces: [...gndPlaces, ...ethorama, ...emapsPlaces, ...eraraPlaces]
          })),
          // filter for places not rendered otb
          switchMap(({gndPlaces, ethorama, emapsPlaces, eraraPlaces, allPlaces}) => 
            this.ethStoreService.linkedDataRecommendations$.pipe(
              map((entities) => {
                const entityIds = new Set(
                  (entities ?? [])
                    .map((e: any) => e.id)
                    .filter((id: string | null | undefined): id is string => Boolean(id))
                );              
                const filteredPlaces = allPlaces.filter((p: any) => {
                  const lccn = p.lccn;
                  if (!lccn) {
                    return true;
                  }
                  return !entityIds.has(lccn);
                });
                return {
                  gndPlaces,
                  ethorama,
                  emapsPlaces,
                  eraraPlaces,
                  allPlaces: filteredPlaces
                }
              })
            )
          ),
          // deduplicate allPlaces
          map(data => {
            const unique = new Map<string, typeof data.allPlaces[number]>();

            data.allPlaces.forEach(place => {
              const key =
                place.gnd ??
                place.qid ??
                place.lccn;
              if (!key) {
                return;
              }
              if (!unique.has(key)) {
                unique.set(key, place);
              }
            });

            return {
              ...data,
              allPlaces: Array.from(unique.values())
            };
          }),          
          //tap(data=>console.error(data))
        );
    }
    catch (error) {
      this.ethErrorHandlingService.logSyncError(error, 'EthGeoRefComponent.getPlaces');
      return of({ gndPlaces: [], ethorama: [],eraraPlaces: [], emapsPlaces: [], allPlaces: []});      
    }
  }


  private getGndIds(record: PnxDoc): string[] {
    const lds03 = record?.pnx?.display?.['lds03'] ?? [];
    return lds03.map( l => {
      l = l.replace('(DE-588)', '');
      // Alma
      if (l.includes('/gnd/')) {
        return l.substring(l.indexOf('gnd/') + 4, l.indexOf('">'));
      }
      // externe Daten
      else if (l.includes('GND:')) {
        return l.substring(l.lastIndexOf(': ') + 2).trim();
      }
      else{
        return null;          
      }
    }).filter((id): id is string => Boolean(id));
  }

  private mapGraphPlacesToVm( data: GraphRelatedPlacesResponse ): PlaceGeoRefVM[] {
    const places = data.features?.[0]?.properties?.places ?? [];
    const map = new Map<string, PlaceGeoRefVM>();

    for (const p of places) {
        const key = p.qid ?? p.lccn ?? p.gnd;
        if (!key || map.has(key)) continue;
        map.set(key, {
          id: p.gnd,
          qid: p.qid,
          lccn: p.lccn,
          gnd: p.gnd,
          thumbnail: p.image,
          label: p.name,
          description: p.description,
          url: this.buildLocationEntityUrl(p.gnd, p.qid, p.lccn)!
        });
      }
    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }

  private mapGndPlacesToVm( data: GraphGndPlacesResponse ): PlaceGeoRefVM[] {
    const map = new Map<string, PlaceGeoRefVM>();
    
    for (const p of data.results) {
        const key = p.qid ?? p.lccn ?? p.gnd;
        if (!key || map.has(key)) continue;
        map.set(key, {
          id: p.gnd,
          qid: p.qid,
          lccn: p.lccn,
          gnd: p.gnd,
          thumbnail: p.image,
          label: p.name,
          description: p.description,
          url: this.buildLocationEntityUrl(p.gnd, p.qid, p.lccn)!
        });
      }
    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }

  private buildLocationEntityUrl(gnd?: string, qid?: string, lccn?: string): string | undefined {
    if( gnd || lccn || qid ){
      let entityId = '';
      if(lccn){
        entityId = lccn;
      }
      else if(gnd && qid){
        entityId = `${gnd},${qid}`;
      }
      else if(qid){
        entityId = qid;
      }
      else if(gnd){
        entityId = `GND${gnd}`;
      }
      return `/entity/location?vid=${this.vid}&lang=${this.lang}&entityId=${entityId}`;
    }
    else {
      return undefined
    }

  }

  private getSourceRecordId(record: PnxDoc): string | undefined{
    return record?.pnx?.control?.['sourcerecordid']?.[0];
  }

  private getType(record: PnxDoc): string | undefined {
    return record?.pnx?.display?.['type']?.[0];
  }
  
  private getLds50(record: PnxDoc): string[] {
    return record?.pnx?.display?.['lds50'] || [];
  }

  private isEmaps(record: PnxDoc): boolean {
    return this.getType(record) === 'map' && this.getLds50(record)?.some((i: string) => i.includes('E01emaps')) 
  }

    navigate(url: string, event: Event){
    event.preventDefault(); 
    this.router.navigateByUrl(url + "#eth-top");
  }

}

  /*
  ngOnDestroy() {
    if (this.mqListener) {
      const mq = window.matchMedia('(max-width: 599px)');
      mq.removeEventListener('change', this.mqListener);
    }
  }*/