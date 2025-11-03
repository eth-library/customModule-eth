import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';

interface TocResponse {
  identifier: string;
  links: { format: string; partOfResource: string; uri: string }[];
}

@Injectable({
  providedIn: 'root'
})

export class EthDnbTocService {
  
  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  // https://daas.library.ethz.ch/rib/v3/enrichments/dnb/toc/979-1-02-100097-1
  // https://services.dnb.de/sru/dnb?version=1.1&operation=searchRetrieve&query=WOE%3D979-1-02-100097-1&recordSchema=MARC21-xml
  getTocLink(isbn:string): Observable<any | null> {
    if (!isbn) {
      return of(null);
    }
    const url = `https://daas.library.ethz.ch/rib/v3/enrichments/dnb/toc/${encodeURIComponent(isbn)}`;
    return this.httpClient.get<TocResponse>(url).pipe(
      map(response => response?.links?.length ? response : null),
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthDnbTocService.getTocLink');
        return of(null);
      })
    )
  }  


}


 