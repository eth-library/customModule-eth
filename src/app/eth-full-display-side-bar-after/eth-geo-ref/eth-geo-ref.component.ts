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
import { EthUtilsService } from '../../services/eth-utils.service';
import { EthMatomoService } from '../../eth-matomo/eth-matomo.service';
import { SHELL_ROUTER } from "../../injection-tokens";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { HostComponent, Doc, PlacesGeoRefVM, PlaceGeoRefVM, GraphRelatedPlacesResponse, EthoramaResponse, EnrichedSinglePoiResponseGraph } from '../../models/eth.model';

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
  places$!: Observable<PlacesGeoRefVM>;
  private mqListener: ((e: MediaQueryListEvent) => void) | null = null;
  private cardPositioned = false;

  lang!: string | null;
  tab!:  string | null;
  scope!:  string | null;
  vid!:  string | null;
  
  constructor(
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethGeoRefService: EthGeoRefService,
    private ethStoreService:EthStoreService,     
    private translate: TranslateService,
    //private ethUtilsService: EthUtilsService,
    private matomoService: EthMatomoService    
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
      })*/
    )
  }

  ngOnDestroy() {
    if (this.mqListener) {
      const mq = window.matchMedia('(max-width: 599px)');
      mq.removeEventListener('change', this.mqListener);
    }
  }


  getPlaces(record: Doc): Observable<PlacesGeoRefVM> { 
    try {
      this.lang = this.translate.currentLang;
      this.vid = this.ethStoreService.getVid();
      this.tab = this.ethStoreService.getTab();
      this.scope = this.ethStoreService.getScope();

      const docId = this.getSourceRecordId(record);

      const emapsPlaces$ = this.isEmaps(record) && docId
        ? this.ethGeoRefService.getEmapsRelatedPlacesFromGraph(docId).pipe(
            map(data => this.mapGraphPlacesToLinks(data)),
            catchError((error) => {
              this.ethErrorHandlingService.handleError(error, 'EthGeoRefComponent.getEmapsRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);

        //const eraraPlaces$ = this.getSourceSystem(record) === 'ILS' && docId && docId.endsWith('5503')
        const eraraPlaces$ = docId && docId.endsWith('5503')
        ? this.ethGeoRefService.getEraraRelatedPlacesFromGraph(docId).pipe(
            map(data => this.mapGraphPlacesToLinks(data)),
            catchError((error) => {
              this.ethErrorHandlingService.handleError(error, 'EthGeoRefComponent.getEraraRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);


      const ethorama$ = docId 
        ? this.ethGeoRefService.getPlacesFromETHorama(docId).pipe(
            switchMap((data: EthoramaResponse) => {
              return data?.items?.length ? this.ethGeoRefService.enrichPOIs(data.items) : of<EnrichedSinglePoiResponseGraph[]>([])
            }),
            map((enrichedPois: EnrichedSinglePoiResponseGraph[]) => {
              const uniquePois = new Map();
              enrichedPois.forEach(p => {
                if (p.qid && !uniquePois.has(p.qid)) {
                  uniquePois.set(p.qid, {
                    id: p.id,
                    qid: p.qid,
                    thumbnail: p.thumbnail,
                    label: p.name,
                    description: p.descriptionWikidata,
                    url: `/search?tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}&query=any,contains,[wd/place]${p.qid}`
                  });
                }
              });
              return Array.from(uniquePois.values()).sort((a,b) => a.label.localeCompare(b.label));
            }),
            catchError(error => {
              this.ethErrorHandlingService.handleError(error, 'getETHoramaPlaces()');
              return of([]);
            })
          )
        : of([]);
      
        return forkJoin([ethorama$, emapsPlaces$, eraraPlaces$]).pipe(
          map(([ethorama, emapsPlaces, eraraPlaces]) => ({
            ethorama,
            emapsPlaces,
            eraraPlaces,
            allPlaces: [...ethorama, ...emapsPlaces, ...eraraPlaces]
          })),
          //tap(data=>console.error(data))
        );
    }
    catch (error) {
      this.ethErrorHandlingService.handleSynchronError(error, 'EthGeoRefComponent.getPlaces');
      return of({ ethorama: [],eraraPlaces: [], emapsPlaces: [], allPlaces: []});      
    }
  }

  private mapGraphPlacesToLinks( data: GraphRelatedPlacesResponse ): PlaceGeoRefVM[] {
    const places = data.features?.[0]?.properties?.places ?? [];
    const map = new Map<string, PlaceGeoRefVM>();

    for (const p of places) {
      if (!p.qid || map.has(p.qid)) continue;

      map.set(p.qid, {
        id: p.gnd,
        qid: p.qid,
        thumbnail: p.image,
        label: p.name ?? '',
        description: p.description,
        url: this.buildSearchUrl(p.qid)
      });
    }

    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }

  private buildSearchUrl(qid: string): string {
    return `/search?tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}&query=any,contains,[wd/place]${qid}`;
  }

  private getSourceRecordId(record: Doc): string | null{
    return record?.pnx?.control?.['sourcerecordid']?.[0] || null;
  }

  private getType(record: Doc): string {
    return record?.pnx?.display?.['type']?.[0] || '';
  }
  
  private getLds50(record: Doc): string[] {
    return record?.pnx?.display?.['lds50'] || [];
  }

  private isEmaps(record: Doc): boolean {
    return this.getType(record) === 'map' && this.getLds50(record)?.some((i: string) => i.includes('E01emaps')) 
  }

  private getSourceSystem(record: Doc): string {
    return record?.pnx?.control?.['sourcesystem']?.[0] || '';
  }  

  navigate(url: string, event: Event){
    event.preventDefault(); 
    this.router.navigateByUrl(url);
  }
}
