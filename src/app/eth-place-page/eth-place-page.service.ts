import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class EthPlacePageService {

    private baseurlETHorama = 'https://api.library.ethz.ch/ethorama/v1/pois';
    private baseurlTopics = 'https://api.library.ethz.ch/geo/v1/geo-topics';
    private baseurlMaps = 'https://api.library.ethz.ch/geo/v1/maps';
    private baseurlPoi = 'https://api.library.ethz.ch/geo/v1/pois';
    private baseurlWikidata = 'https://daas.library.ethz.ch/rib/v3/places/';
    

    constructor(
        private http: HttpClient,
        private ethErrorHandlingService: EthErrorHandlingService,
    ) {}

    getPlaceFromETHorama(qid: string): Observable<any> {
        const url = `${this.baseurlETHorama}?apikey=XKosnD8xM5AuyvuovfebqpHUzkrMi0qqlVKcM5gHYDANCyds&details=true&qId=${qid}`;
        return this.http.get(url).pipe(
            map(response => {
              return response;
            }),          
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPlacePageService.getPlaceFromETHorama'))     
        );
    }

    // https://api.library.ethz.ch/geo/v1/geo-topics/?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&q=Q15283
    getTopicsFromGeoGraph(qid: string): Observable<any> {
        const url = `${this.baseurlTopics}?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&q=${qid}`;
        return this.http.get(url).pipe(
            map(response => {
              return response;
            }),          
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPlacePageService.getTopicsFromGeoGraph'))     
        );
    }

    // https://daas.library.ethz.ch/rib/v3/graph/maps?lat=47.349952&lon=8.490838
    getMapsFromGeoGraph(lat: string, lng: string): Observable<any> {
        const url = `${this.baseurlMaps}?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&lat=${lat}&lon=${lng}`;
        return this.http.get(url).pipe(
            map(response => {
              return response;
            }),          
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPlacePageService.getMapsFromGeoGraph'))     
        );
    }

    getPoiFromGeoGraph(qid: string): Observable<any> {
        const url = `${this.baseurlPoi}?apikey=Hnwc3kaBnR51pXTenynY7BnG10cgtsDf4YWIA5AbA0Lm9Uq9&edges=true&q=${qid}`;
        return this.http.get(url).pipe(
            map(response => {
              return response;
            }),          
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPlacePageService.getPoiFromGeoGraph'))     
        );
    }

    // https://daas.library.ethz.ch/rib/v3/places/Q27494?lang=en
    getPlaceFromWikidata(qid: string, lang: string): Observable<any> {
        const url = `${this.baseurlWikidata}/${qid}?lang=${lang}`;
        return this.http.get(url).pipe(
            map(response => {
              return response;
            }),          
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPlacePageService.getPlaceFromWikidata'))     
        );
    }

}