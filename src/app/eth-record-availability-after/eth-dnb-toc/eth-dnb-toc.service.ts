import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { DnbTocApiResponse } from '../../models/eth.model';

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
  getTocLink(isbn:string): Observable<DnbTocApiResponse> {
    const url = `https://daas.library.ethz.ch/rib/v3/enrichments/dnb/toc/${encodeURIComponent(isbn)}`;
    return this.httpClient.get<DnbTocApiResponse>(url).pipe(
      map(response => ({
        identifier: response.identifier,
        links: (response.links ?? []).filter(link => !!link?.uri)
      })),
      catchError(e => {
        this.ethErrorHandlingService.logError(e, 'EthDnbTocService.getTocLink');
        return throwError(() => e);
      })
    )
  }  


}


 