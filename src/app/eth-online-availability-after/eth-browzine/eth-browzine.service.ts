import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';


@Injectable({
  providedIn: 'root'
})
export class EthBrowzineService {
 
  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  // https://thirdiron.atlassian.net/wiki/spaces/BrowZineAPIDocs/pages/66191466/Journal+Availability+Endpoint
  getJournalLink(issns:string): Observable<string | null> {
    if (!issns || (Array.isArray(issns) && issns.length === 0)) {
      return of(null);
    }
    const url = `https://daas.library.ethz.ch/rib/v3/enrichments/browzine?issns=${encodeURIComponent(issns)}`;
    return this.httpClient.get(url).pipe(
      map((response: any) => {
        const validLink = response.data.find((item:any) => item.browzineWebLink)?.browzineWebLink;
        return validLink || null;
      }),
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthBrowzineService');
        return of(null);
      })
    ) 
  }  

}
 