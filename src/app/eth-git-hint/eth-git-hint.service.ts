import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError  } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { GitHintResponse } from '../models/eth.model';


@Injectable({
  providedIn: 'root'
})
export class EthGitHintService {

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  getHint(lang: keyof GitHintResponse): Observable<string> {
    return this.httpClient.get<GitHintResponse>('https://daas.library.ethz.ch/rib/v3/nde/git-hint').pipe(
    //return this.httpClient.get<GitHintResponse>('https://daas.library.ethz.ch/rib/v3/nde/git-hint-test').pipe(
      map(response => response[lang]), 
      catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthGitHintService'))
    );
  }

}
