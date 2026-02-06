
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { NewsFeedAPIResponse } from '../models/eth.model';

@Injectable({
  providedIn: 'root'
})
export class EthBibNewsService {
  private static readonly BASE_URL = 'https://daas.library.ethz.ch/rib/v3/bib-news';
  private static readonly DEFAULT_LANG = 'de';

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  getNews(lang: string = EthBibNewsService.DEFAULT_LANG): Observable<NewsFeedAPIResponse> {
    const params = new HttpParams().set('lang', lang);
    
    return this.httpClient.get<NewsFeedAPIResponse>(EthBibNewsService.BASE_URL, { params }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.ethErrorHandlingService.logError(error, 'EthBibNewsService.getNews()');
        return throwError(() => error);
      })
    );
  }
}