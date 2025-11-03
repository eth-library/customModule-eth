import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { ArticleLink } from '../../models/article.model';

@Injectable({
  providedIn: 'root'
})

 
export class EthFulltextService {
 
  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  getArticleLink$(doi:string, onCampus: boolean): Observable<ArticleLink | null> {
    const baseUrl = 'https://daas.library.ethz.ch/rib/v3/enrichments/';
    const endpoint = onCampus ? 'fulltext-oncampus' : 'fulltext-offcampus';
    const url = `${baseUrl}/${endpoint}?doi=${encodeURIComponent(doi)}`;    
    return this.httpClient.get<ArticleLink | null>(url).pipe(
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthFulltextService');
        return of(null);
      })
    )
  }  

}