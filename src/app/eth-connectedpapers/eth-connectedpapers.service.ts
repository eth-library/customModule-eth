import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { ConnectedPapersResponse } from '../models/eth.model';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class EthConnectedpapersService {
 
  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  getPaper(doi: string): Observable<ConnectedPapersResponse | null> {
    if (!doi) {
      return of(null);
    }
    const url = "https://daas.library.ethz.ch/rib/v3/enrichments/connectedpapers?doi=" + doi;
    return this.httpClient.get<ConnectedPapersResponse>(url).pipe(
        catchError((error) => {
          this.ethErrorHandlingService.handleError(error, 'EthConnectedpapersService.getPaper()')
          return of(null);
        })
    )
  }
  
  
  // No proxy and cache
  /*getPaperWithoutProxy(doi: string): Observable<any | null> {
    const baseUrl = 'https://rest.prod.connectedpapers.com';

    return this.httpClient.get<{ paperId: string }>(`${baseUrl}/id_translator/doi/${encodeURIComponent(doi)}`).pipe(
      switchMap(response => {
        if (!response.paperId) {
          return of(null);
        }
        return this.httpClient.get<any>(`${baseUrl}/paper/${response.paperId}`);
      }),
      catchError(error => {
        console.error('error in ConnectedPapers addon - EthConnectedpapersService.getPaper():', error);
        return of(null);
      })
    );
  }*/

}
