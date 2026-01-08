import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { NewsFeedAPIResponse } from '../models/eth.model';

@Injectable({
  providedIn: 'root'
})
export class EthBibNewsService {

  private readonly baseUrl = 'https://daas.library.ethz.ch/rib/v3/bib-news';

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  getNews(lang: string = 'de'): Observable<NewsFeedAPIResponse | null> {
    const url = `${this.baseUrl}?lang=${lang}`;
    return this.httpClient.get<NewsFeedAPIResponse>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        this.ethErrorHandlingService.handleError(error, 'EthBibNewsService')
        return of(null);
      })
    );
  }
  
}
