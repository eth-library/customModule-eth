import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, of, forkJoin } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { GraphRelatedPlacesResponse, GraphGndPlacesResponse, EthoramaAPIResponse, EthoramaPoi, EnrichedPoiAPIResponse, GraphSinglePoiAPIResponse } from '../../models/eth.model';

@Injectable({
  providedIn: 'root'
})
export class EthGeoRefService {

  private readonly graphUrlPois = 'https://daas.library.ethz.ch/rib/v3/graph/pois';
  private readonly graphUrlEmaps = 'https://daas.library.ethz.ch/rib/v3/graph/e-maps';
  private readonly graphUrlErara = 'https://daas.library.ethz.ch/rib/v3/graph/e-rara-items';
  private readonly graphUrlGnd = 'https://daas.library.ethz.ch/rib/v3/graph/places-by-gnd-list';
  private readonly ethoramaUrl = 'https://api.library.ethz.ch/ethorama/v1/pois?apikey=BKFefOQWF3VGq2sreNcyLqK7Gob61xO9jnLQAd0wy82ktIYn&pageSize=100&details=false';

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}


  // https://api.library.ethz.ch/ethorama/v1/pois?apikey=BKFefOQWF3VGq2sreNcyLqK7Gob61xO9jnLQAd0wy82ktIYn&pageSize=100&details=false&docId=990038990900205503
  getPlacesFromETHorama(docId: string): Observable<EthoramaAPIResponse> {
    return this.httpClient.get<EthoramaAPIResponse>(`${this.ethoramaUrl}&docId=${docId}`);
  }
  
  // https://daas.library.ethz.ch/rib/v3/graph/e-rara-items/990038990900205503?edges=true
  getEraraRelatedPlacesFromGraph(docId: string): Observable<GraphRelatedPlacesResponse> {
    const url = `${this.graphUrlErara}/${docId}?edges=true`;
    return this.httpClient.get<GraphRelatedPlacesResponse>(url);
  }  
  
  // https://daas.library.ethz.ch/rib/v3/graph/e-maps/99117998955005503?edges=true
  getEmapsRelatedPlacesFromGraph(docId: string): Observable<GraphRelatedPlacesResponse> {
    const url = `${this.graphUrlEmaps}/${docId}?edges=true`;
    return this.httpClient.get<GraphRelatedPlacesResponse>(url);
  }  

  // https://daas.library.ethz.ch/rib/v3/graph/places?gnd=4018272-1
  getGndPlacesFromGraph(gnds: string): Observable<GraphGndPlacesResponse> {
    const url = `${this.graphUrlGnd}?gnd=${gnds}`;
    return this.httpClient.get<GraphGndPlacesResponse>(url);
  }  

  // enrich ETHorama Poi by Geodata Graph
  // https://daas.library.ethz.ch/rib/v3/graph/pois/2awJViV5HONdrpBWHFHX
  enrichPOIs(pois: EthoramaPoi[]): Observable<EnrichedPoiAPIResponse[]> {
    if (!pois || pois.length === 0) {
      return of([]);
    }    

    const enrichedPois$ = pois.map(poi =>
      this.httpClient.get<GraphSinglePoiAPIResponse>(`${this.graphUrlPois}/${poi.id}`).pipe(
        map(response => {
          const feature = response?.features?.[0]?.properties;
          const enriched: EnrichedPoiAPIResponse = {
            id: poi.id,
            thumbnail: poi.thumbnail,
            qid: feature?.qid,
            lccn: feature?.lccn,
            gnd: feature?.gnd,
            name: feature?.name_de,
            descriptionWikidata: feature?.descriptionWikidata
          };
          return enriched;
        }),
        catchError(error => {
          this.ethErrorHandlingService.logError(error, 'EthGeoRefService.enrichPOIs()');
          const fallback: EnrichedPoiAPIResponse = {
            id: poi.id,
            thumbnail: poi.thumbnail,
            qid: '',
            name: '',
            descriptionWikidata: ''
          };
          return of(fallback);
        })
      )
    );
    return forkJoin(enrichedPois$);
  }
  
}