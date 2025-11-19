import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, throwError, catchError, of, forkJoin } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';


@Injectable({
  providedIn: 'root'
})
export class EthGeoRefService {

  private readonly graphUrlPlaces = 'https://daas.library.ethz.ch/rib/v3/graph/places-by-gnd-list';
  private readonly graphUrlPois = 'https://daas.library.ethz.ch/rib/v3/graph/pois';
  private readonly graphUrlEmaps = 'https://daas.library.ethz.ch/rib/v3/graph/e-maps';
  private readonly graphUrlErara = 'https://daas.library.ethz.ch/rib/v3/graph/e-rara-items';
  //private readonly wikipediaApiUrl = 'https://de.wikipedia.org/w/api.php?action=query&prop=pageprops&format=json&origin=*';
  private readonly ethoramaUrl = 'https://api.library.ethz.ch/ethorama/v1/pois?apikey=BKFefOQWF3VGq2sreNcyLqK7Gob61xO9jnLQAd0wy82ktIYn&pageSize=100&details=false';

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}


  enrichPOIs(pois: any[]): Observable<any[]> {
    const enrichedPOIs$ = pois.map(poi =>
      this.httpClient.get<any>(`${this.graphUrlPois}/${poi.id}`).pipe(
        map(response => {
          const feature = response?.features?.[0]?.properties;
          if (feature) {
            return {
              ...poi,
              qid: feature.qid,
              descriptionWikidata: feature.descriptionWikidata,
              name: feature.name_de
            };
          } else {
            console.error(`Nothing found for POI ${poi.id}.`);
            return poi; 
          }
        }),
        catchError(error => {
          this.ethErrorHandlingService.handleError(error, 'EthGeoRefService.enrichPOIs')
          return of(poi);
        })
      )
    );
    return forkJoin(enrichedPOIs$);
  }


  getPlacesFromETHorama(docId: string): Observable<any> {
    return this.httpClient.get(`${this.ethoramaUrl}&docId=${docId}`).pipe(
      catchError((error) => {
        // if not found: HTTP 500
        //this.ethErrorHandlingService.handleError(error, 'EthGeoRefService.getPlacesFromETHorama');
        return of([]);
      })      
    );
  }

  getPlacesFromTopics(gnds: string[]): Observable<any> {
    const aGndId = gnds.map((lds:any) => {
      if (lds.includes('/gnd/')) {
        return lds.split('/gnd/')[1].split('">')[0].replace('(DE-588)', '');
      } else if (lds.includes(': ')) {
        return lds.split(': ').pop()?.replace('(DE-588)', '') || '';
      }
      return '';
    }).filter(Boolean);

    const url = `${this.graphUrlPlaces}?gnd=${aGndId.join(',')}`;
    return this.httpClient.get(url).pipe(
      catchError((error) => {
        this.ethErrorHandlingService.handleError(error, 'EthGeoRefService.getPlacesFromTopics')
        return of([]);
      })      
    );
  }  

  // https://daas.library.ethz.ch/rib/v3/graph/e-rara-items/990038990900205503?edges=true
  getEraraRelatedPlacesFromGraph(docId: string): Observable<any> {
    const url = `${this.graphUrlErara}/${docId}?edges=true`;
    return this.httpClient.get(url).pipe(
      catchError((error) => {
        this.ethErrorHandlingService.handleError(error, 'EthGeoRefService.getEraraRelatedPlacesFromGraph')
        return of([]);
      })      
    );
  }  
  
  // https://daas.library.ethz.ch/rib/v3/graph/e-maps/99117998955005503?edges=true
  getEmapsRelatedPlacesFromGraph(docId: string): Observable<any> {
    const url = `${this.graphUrlEmaps}/${docId}?edges=true`;
    return this.httpClient.get(url).pipe(
      catchError((error) => {
        this.ethErrorHandlingService.handleError(error, 'EthGeoRefService.getEmapsRelatedPlacesFromGraph')
        return of([]);
      })      
    );
  }  
 
}



/*
  enrichPOIsFromWikipedia(pois: any[]): Observable<any[]> {
    let titles = pois
      .filter(poi => poi.references?.wikipedia?.de || poi.references?.wikipedia?.en)
      .map(poi => {
        const link = poi.references.wikipedia.de || poi.references.wikipedia.en;
        let title = decodeURIComponent(link.substring(link.lastIndexOf('/') + 1));
        title = title.replace('%28', '(').replace('%29', ')');
        title = title.includes('#') ? title.split('#')[0] : title.trim();
        poi.wikiTitle = title;
        return title;
      })
      .slice(0, 50) // Wikipedia API erlaubt maximal 50 Titel
      .join('|');

    if (!titles) return throwError(() => new Error('No valid Wikipedia titles found'));
    
    return this.httpClient.get<any>(`${this.wikipediaApiUrl}&titles=${titles}`).pipe(
      map(response => {
        const mapTitleQid: Record<string, string> = {};
        for (const key in response.query.pages) {
          const page = response.query.pages[key];
          if (page.pageprops) {
            let title = page.title;
            if (response.query.normalized) {
              const norm = response.query.normalized.find((e:any) => e.to === title);
              if (norm) title = norm.from;
            }
            mapTitleQid[title] = page.pageprops['wikibase_item'];
          }
        }
        return pois.map(poi => {
          if (poi.wikiTitle && mapTitleQid[poi.wikiTitle]) {
            poi.qid = mapTitleQid[poi.wikiTitle];
          } else {
            const decodedTitle = decodeURIComponent(poi.wikiTitle || '');
            if (mapTitleQid[decodedTitle]) {
              poi.qid = mapTitleQid[decodedTitle];
              poi.wikiTitle = decodedTitle;
            }
          }
          return poi;
        });
      }),
      catchError((error) => {
        this.ethErrorHandlingService.handleError(error, 'EthGeoRefService.enrichPOIsFromWikipedia')
        return of([]);
      })      
    );
  }
*/
