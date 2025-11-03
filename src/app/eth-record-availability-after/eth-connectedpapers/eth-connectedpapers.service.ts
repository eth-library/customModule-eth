import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, switchMap  } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class EthConnectedpapersService {
 
  constructor(
    private httpClient: HttpClient,
  ){}

  getPaperViaProxy(doi:string): Observable<any | null> {
    if (!doi) {
      return of(null);
    }
    const url = "https://daas.library.ethz.ch/rib/v3/enrichments/connectedpapers?doi=" + doi;
    return this.httpClient.get(url).pipe(
      catchError(error => {
        console.error('error in ConnectedPapers addon - EthConnectedpapersService.getPaperViaProxy():', error);
        return of(null);
      })
    )
  }
  // No proxy and cache
  getPaper(doi: string): Observable<any | null> {
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
  }

}
