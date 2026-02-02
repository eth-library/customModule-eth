import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { GraphGeoInfoAPIResponse, EthoramaAPIResponse, WikidataPlaceAPIResponse, WikiIdentifierForLccnAPIResponse } from '../models/eth.model';

@Injectable({
  providedIn: 'root'
})
export class EthLocationPageService {

    private baseurlETHorama = 'https://api.library.ethz.ch/ethorama/v1/pois';
    private baseurlTopics = 'https://api.library.ethz.ch/geo/v1/geo-topics';
    private baseurlMaps = 'https://api.library.ethz.ch/geo/v1/maps';
    private baseurlPoi = 'https://api.library.ethz.ch/geo/v1/pois';
    private baseurlWikidataByQID = 'https://daas.library.ethz.ch/rib/v3/places/';
    private baseurlWikidataByGND = '// https://daas.library.ethz.ch/rib/v3/places/gnd/'
    private baseUrlIdentifierForLccn = 'https://daas.library.ethz.ch/rib/v3/places/lccn-identifier';

    constructor(
        private http: HttpClient,
        private ethErrorHandlingService: EthErrorHandlingService,
    ) {}

    // https://api.library.ethz.ch/ethorama/v1/pois?apikey=XKosnD8xM5AuyvuovfebqpHUzkrMi0qqlVKcM5gHYDANCyds&details=false&qId=Q15283
    getPlaceFromETHorama(qid: string): Observable<EthoramaAPIResponse> {
      const url = `${this.baseurlETHorama}?apikey=XKosnD8xM5AuyvuovfebqpHUzkrMi0qqlVKcM5gHYDANCyds&details=false&qId=${qid}`;
      return this.http.get<EthoramaAPIResponse>(url).pipe(
        catchError((e) => {
          // if not found: HTTP 500
          this.ethErrorHandlingService.logError(e, 'EthLocationPageService.getPlacesFromETHorama');
          return throwError(() => e);
        })            
      );
    }


    // https://api.library.ethz.ch/geo/v1/pois?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&qid=Q15283
    getPoiFromGeoGraph(gnd: string | undefined, qid: string | undefined): Observable<GraphGeoInfoAPIResponse> {
      const url = `${this.baseurlPoi}?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&qid=${qid}&gnd=${gnd}`;
      return this.http.get<GraphGeoInfoAPIResponse>(url).pipe(
        catchError((e) => {
          this.ethErrorHandlingService.logError(e, 'EthLocationPageService.getPoiFromGeoGraph');
          return throwError(() => e);
        })            
      );
    }


    // https://api.library.ethz.ch/geo/v1/geo-topics/?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&q=Q15283
    getTopicsFromGeoGraph(gnd: string | undefined, qid: string | undefined): Observable<GraphGeoInfoAPIResponse> {
      const url = `${this.baseurlTopics}?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=false&qid=${qid}&gnd=${gnd}`;
      return this.http.get<GraphGeoInfoAPIResponse>(url).pipe(
        catchError((e) => {
          this.ethErrorHandlingService.logError(e, 'EthLocationPageService.getTopicsFromGeoGraph');
          return throwError(() => e);
        })            
      );
    }
    

    // https://daas.library.ethz.ch/rib/v3/graph/maps?lat=47.349952&lon=8.490838
    getMapsFromGeoGraph(lat: string, lng: string): Observable<GraphGeoInfoAPIResponse> {
      const url = `${this.baseurlMaps}?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&lat=${lat}&lon=${lng}`;
      return this.http.get<GraphGeoInfoAPIResponse>(url).pipe(
        catchError((e) => {
          this.ethErrorHandlingService.logError(e, 'EthLocationPageService.getMapsFromGeoGraph');
          return throwError(() => e);
        })            
      );
    }
    

    // https://daas.library.ethz.ch/rib/v3/places/Q27494?lang=en
    getPlaceFromWikidata(gnd: string | undefined, qid: string | undefined, lang: string): Observable<WikidataPlaceAPIResponse> {
      let url;
      if(qid){
        url = `${this.baseurlWikidataByQID}/${qid}?lang=${lang}`;
      }
      else{
        url = `${this.baseurlWikidataByQID}/gnd/${gnd}?lang=${lang}`;
      }
      return this.http.get<WikidataPlaceAPIResponse>(url).pipe(
          map(response => {
            return response;
          }),          
          catchError((e) => {
            this.ethErrorHandlingService.logError(e, 'EthLocationPageService.getPlaceFromWikidata');
            return throwError(() => e);
          })            
      );
    }

    // https://daas.library.ethz.ch/rib/v3/places/lccn-identifier/n79007751
    getIdentifierForLccn(lccn: string): Observable<WikiIdentifierForLccnAPIResponse> {
      const url = `${this.baseUrlIdentifierForLccn}/${lccn}`;
      return this.http.get<WikiIdentifierForLccnAPIResponse>(url).pipe(
          map(response => {
            return response;
          }),          
          catchError((e) => {
            this.ethErrorHandlingService.logError(e, 'EthLocationPageService.getIdentifierForLccn');
            return throwError(() => e);
          })            
      );
    }


}