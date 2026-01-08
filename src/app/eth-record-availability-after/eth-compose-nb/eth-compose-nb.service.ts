import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { NbPrintApiResponse, PrimoApiResponse } from '../../models/eth.model';

@Injectable({ providedIn: 'root' })
export class EthComposeNbService {
  private readonly baseUrl = 'https://daas.library.ethz.ch/rib/v3';

  constructor(
    private http: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  getPrintData(nebisId: string): Observable<NbPrintApiResponse | null> {
    const url = `${this.baseUrl}/mapping/redirect?result=map&id=${encodeURIComponent(nebisId)}`;

    return this.http.get<NbPrintApiResponse>(url).pipe(
      catchError(error => {
        if (error.status !== 404) {
          this.ethErrorHandlingService.handleError(error, 'EthComposeNbService.getPrintData');
        }
        return of(null);
      })
    );
  }

  getOnlineData(oaiId: string): Observable<PrimoApiResponse | null> {
    const url = `${this.baseUrl}/search?limit=50&q=any,contains,${encodeURIComponent(oaiId)}`;

    return this.http.get<PrimoApiResponse>(url).pipe(
      catchError(error => {
        if (error.status !== 404) {
          this.ethErrorHandlingService.handleError(error, 'EthComposeNbService.getOnlineData');
        }
        return of(null);
      })
    );
  }
}
