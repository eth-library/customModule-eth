import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, throwError  } from 'rxjs';
import { EthErrorHandlingService } from '../../src/app/services/eth-error-handling.service';
import { GitHintAPIResponse, GitHintVM } from '../../src/app/models/eth.model';


@Injectable({
  providedIn: 'root'
})
export class EthGitHintService {

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  getHint(lang: keyof GitHintAPIResponse): Observable<GitHintVM> {
    //return this.httpClient.get<GitHintAPIResponse>('https://daas.library.ethz.ch/rib/v3/nde/git-hint').pipe(
    return this.httpClient.get<GitHintAPIResponse>('https://daas.library.ethz.ch/rib/v3/nde/git-hint-test').pipe(
      map(response => response[lang]), 
      catchError(e => {
        this.ethErrorHandlingService.logError(e, 'EthGitHintService');
        return throwError(() => e);
      })      
    );
  }

}
