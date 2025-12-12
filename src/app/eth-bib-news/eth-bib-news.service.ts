// News on the home page
// https://jira.ethz.ch/browse/SLSP-2128

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class EthBibNewsService {

  private readonly baseUrl = 'https://daas.library.ethz.ch/rib/v3/bib-news';

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  getNews(lang: string = 'de'): Observable<any | null> {
    const url = `${this.baseUrl}?lang=${lang}`;
    return this.httpClient.get(url).pipe(
      catchError((error: HttpErrorResponse) => {
        this.ethErrorHandlingService.handleError(error, 'EthBibNewsService')
        return of(null);
      })
    );
  }
  
}
