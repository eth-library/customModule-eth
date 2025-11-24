import { Component, Input } from '@angular/core';
import { EthGeoRefService } from './eth-geo-ref.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { Doc } from '../../models/search.model';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { EthUtilsService } from '../../services/eth-utils.service';
import { EthMatomoService } from '../../eth-matomo/eth-matomo.service';

type placeLinks = { ethorama: any[]; eraraPlaces: any[]; emapsPlaces: any[]; allPlaces: any[] }

@Component({
  selector: 'custom-eth-geo-ref',
  templateUrl: './eth-geo-ref.component.html',
  styleUrls: ['./eth-geo-ref.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule
  ]     
})
export class EthGeoRefComponent {

  @Input() hostComponent: any = {};
  placeLinks$!: Observable<placeLinks>;
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
    private ethUtilsService: EthUtilsService,
    private matomoService: EthMatomoService    
  ) {}

  ngAfterViewInit() {
    this.placeLinks$ = this.ethStoreService.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getPlaceLinks(record)),
      tap( (placeLinks) => {
        if (placeLinks.ethorama.length > 0 && !this.cardPositioned) {
          this.cardPositioned = true;
          this.mqListener = this.ethUtilsService.positionCard(
            '.eth-place-cards'
          );
        }
      })
    )
  }

  ngOnDestroy() {
    if (this.mqListener) {
      const mq = window.matchMedia('(max-width: 599px)');
      mq.removeEventListener('change', this.mqListener);
    }
  }


  getPlaceLinks(record: any): Observable<placeLinks> { 
    try {
      this.lang = this.translate.currentLang;
      this.vid = this.ethStoreService.getVid();
      this.tab = this.ethStoreService.getTab();
      this.scope = this.ethStoreService.getScope();

      const docId = this.getSourceRecordId(record);

      const emapsPlaces$ = this.isEmaps(record) && docId
        ? this.ethGeoRefService.getEmapsRelatedPlacesFromGraph(docId).pipe(
              map((data: any) => {
                const places = data?.features?.[0]?.properties?.places;
                const uniquePlaces = new Map();
                if(places){
                  places.forEach((p:any) => {
                    if (p.qid && !uniquePlaces.has(p.qid)) {
                      uniquePlaces.set(p.qid, {
                        id: p.gnd,
                        qid: p.qid,
                        thumbnail: p.image,
                        label: p.name,
                        description: p.description,
                        url: `/discovery/search?tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}&query=any,contains,[wd/place]${p.qid}`
                      });
                    }
                  });
                }
                return Array.from(uniquePlaces.values()).sort((a,b) => a.label.localeCompare(b.label));
              }
            ),
            catchError((error) => {
              this.ethErrorHandlingService.handleError(error, 'EthGeoRefComponent.getEmapsRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);

        //const eraraPlaces$ = this.getSourceSystem(record) === 'ILS' && docId && docId.endsWith('5503')
        const eraraPlaces$ = docId && docId.endsWith('5503')
        ? this.ethGeoRefService.getEraraRelatedPlacesFromGraph(docId).pipe(
              map((data: any) => {
                const places = data?.features?.[0]?.properties?.places;
                const uniquePlaces = new Map();
                if(places){
                  places.forEach((p:any) => {
                    if (p.qid && !uniquePlaces.has(p.qid)) {
                      uniquePlaces.set(p.qid, {
                        id: p.gnd,
                        qid: p.qid,
                        thumbnail: p.image,
                        label: p.name,
                        description: p.description,
                        url: `/discovery/search?tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}&query=any,contains,[wd/place]${p.qid}`
                      });
                    }
                  });
                }
                return Array.from(uniquePlaces.values()).sort((a,b) => a.label.localeCompare(b.label));
              }
            ),
            catchError((error) => {
              this.ethErrorHandlingService.handleError(error, 'EthGeoRefComponent.getEraraRelatedPlacesFromGraph()')
              return of([]);
            })      
        )
        : of([]);


      const ethorama$ = docId 
        ? this.ethGeoRefService.getPlacesFromETHorama(docId).pipe(
            switchMap(data => data?.items?.length ? this.ethGeoRefService.enrichPOIs(data.items) : of([])),
            map(enrichedPois => {
              const uniquePois = new Map();
              enrichedPois.forEach(p => {
                if (p.qid && !uniquePois.has(p.qid)) {
                  uniquePois.set(p.qid, {
                    id: p.id,
                    qid: p.qid,
                    thumbnail: p.thumbnail,
                    label: p.name,
                    description: p.descriptionWikidata,
                    url: `/discovery/search?tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}&query=any,contains,[wd/place]${p.qid}`
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
      this.ethErrorHandlingService.handleSynchronError(error, 'EthGeoRefComponent.getPlaceLinks');
      return of({ ethorama: [],eraraPlaces: [], emapsPlaces: [], allPlaces: []});      
    }
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

  navigateToPlacePage(url: string){
    this.matomoService.trackEvent('lod','click','georef->placepage');
    window.location.href = url;
    // router.navigateByUrl(url);
  }
}


      /*
      type placeLinks = { ethorama: any[]; topics: any[]; hasPlace: boolean; counter: number }

      const topics$ = lds03?.length
        ? this.ethGeoRefService.getPlacesFromTopics(lds03).pipe(
            map((data: any) =>
              data?.results?.length ? data.results
                .filter((p: any) => p.qid)
                .map((p: any) => ({
                  ...p,
                  url: `/discovery/search?tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}&query=[wd/place]${p.qid}`
                }))
                : []
            ),
            //tap(r=>console.error(r)),
            catchError((error) => {
              this.ethErrorHandlingService.handleError(error, 'EthGeoRefComponent.getPlacesFromTopics()')
              return of([]);
            })      
        )
        : of([]);

        return forkJoin([ethorama$, topics$]).pipe(
          map(([ethorama, topics]) => ({
            ethorama,
            topics,
            hasPlace: (ethorama?.length ?? 0) > 0 || (topics?.length ?? 0) > 0,
            counter: (ethorama?.length ?? 0) + (topics?.length ?? 0)
          }))
      );*/

      /*
              return ethorama$.pipe(
          map(ethorama => {
            const counter = ethorama?.length ?? 0;
            const hasPlace = counter > 0;
            return {
              ethorama,
              hasPlace,
              counter
            };
          })
        );

      */