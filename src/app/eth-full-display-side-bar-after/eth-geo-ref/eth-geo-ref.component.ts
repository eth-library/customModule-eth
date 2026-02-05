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
import { HostComponent, PnxDoc, PlacesGeoRefVM, PlaceGeoRefVM, LobidAPIResponse, GraphRelatedPlacesResponse, GraphGndPlacesResponse, EthoramaAPIResponse, EnrichedPoiAPIResponse } from '../../models/eth.model';

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


      const gndPlacesLobid$ = gndIds?.length
        ? this.ethGeoRefService.getPlacesFromLobid(gndIds.join(',')).pipe(
            map(data => this.mapGndPlacesLobidToVm(data)),
            map(places =>
              places.filter(
                 p => p.description != null || p.thumbnail != null
              )
            ),            
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.gndPlacesLobid()')
              return of([]);
            })      
        )
        : of([]);

      const gndPlacesGraph$ = gndIds?.length
        ? this.ethGeoRefService.getGndPlacesFromGraph(gndIds.join(',')).pipe(
            map(data => this.mapGndPlacesGraphToVm(data)),
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.getGndPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);

        /*
        const emapsPlaces$ = this.isEmaps(record) && docId
        ? this.ethGeoRefService.getEmapsRelatedPlacesFromGraph(docId).pipe(
            map(data => this.mapGraphPlacesToVm(data)),
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.getEmapsRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);


        const eraraPlaces$ = docId && docId.endsWith('5503')
        ? this.ethGeoRefService.getEraraRelatedPlacesFromGraph(docId).pipe(
            map(data => this.mapGraphPlacesToVm(data)),
            catchError((error) => {
              this.ethErrorHandlingService.logError(error, 'EthGeoRefComponent.getEraraRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);
        */

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
      
        
        return forkJoin([gndPlacesLobid$, gndPlacesGraph$, ethorama$]).pipe(
          map(([gndPlacesLobid, gndPlacesGraph, ethorama]) => ({
            gndPlacesLobid,
            gndPlacesGraph,
            ethorama,
            allPlaces: [...gndPlacesLobid,...gndPlacesGraph, ...ethorama]
          })),
          // filter for places not rendered otb
          switchMap(({gndPlacesLobid, gndPlacesGraph, ethorama, allPlaces}) => 
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
                  gndPlacesLobid,
                  gndPlacesGraph,
                  ethorama,
                  allPlaces: filteredPlaces
                }
              })
            )
          ),
          // deduplicate allPlaces
          map(data => ({
            ...data,
            allPlaces: this.mergePlacesById(data.allPlaces)
          })),
          tap(data=>console.error(data))
        );
    }
    catch (error) {
      this.ethErrorHandlingService.logSyncError(error, 'EthGeoRefComponent.getPlaces');
      return of({ gndPlacesLobid: [],gndPlacesGraph: [], ethorama: [],eraraPlaces: [], emapsPlaces: [], allPlaces: []});      
    }
  }


  private mergePlacesById(places: PlaceGeoRefVM[]): PlaceGeoRefVM[] {
    const index = new Map<string, PlaceGeoRefVM>();

    const getKeys = (p: PlaceGeoRefVM) =>
      [p.qid, p.gnd, p.lccn].filter(Boolean) as string[];

    for (const place of places) {
      const keys = getKeys(place);
      if (keys.length === 0) continue;

      const existing = keys
        .map(k => index.get(k))
        .find(Boolean);

      if (!existing) {
        keys.forEach(k => index.set(k, place));
      } else {
        const merged: PlaceGeoRefVM = {
          ...existing,
          ...place,
          qid: existing.qid ?? place.qid,
          gnd: existing.gnd ?? place.gnd,
          lccn: existing.lccn ?? place.lccn,
          description: existing.description ?? place.description,
          //description: existing.description + '; ' + place.description,
          thumbnail: existing.thumbnail ?? place.thumbnail
        };

        // Have all keys point to the merged object
        [...new Set([...getKeys(existing), ...keys])]
          .forEach(k => index.set(k, merged));
      }
    }

    // extract uniques 
    return Array.from(new Set(index.values()));
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

  /*
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
    */

private mapGndPlacesLobidToVm( data: LobidAPIResponse ): PlaceGeoRefVM[] {
    const map = new Map<string, PlaceGeoRefVM>();
    for (const p of data.member) {
      const gnd = p.gndIdentifier;
      const qid = p.sameAs?.find(
        (s: any) => s.id?.includes('wikidata.org/entity/')
      )?.id?.split('/').pop();
      const lccn = p.sameAs?.find(
        (s: any) => s.id?.includes('id.loc.gov')
      )?.id?.split('/').pop();      
      const key = gnd;
      if (!key || map.has(key)) continue;
      map.set(key, {
        id: gnd,
        qid: qid,
        lccn: lccn,
        gnd: gnd,
        thumbnail:  p.depiction?.[0]?.thumbnail,
        label: p.preferredName,
        description: p.biographicalOrHistoricalInformation?.[0],
        url: this.buildLocationEntityUrl(gnd, qid, lccn)!
      });
    }
    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }


  private mapGndPlacesGraphToVm( data: GraphGndPlacesResponse ): PlaceGeoRefVM[] {
    const map = new Map<string, PlaceGeoRefVM>();
    console.error(data)
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