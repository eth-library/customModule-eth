import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class EthComposeNbService {

  private readonly baseUrl = 'https://daas.library.ethz.ch/rib/v3';

  constructor(
    private http: HttpClient,
      private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  
  // https://daas.library.ethz.ch/rib/v3/mapping/redirect?result=map&id=ebi01_prod004464904
  getPrintData(nebisId: string) {
    const url = `${this.baseUrl}/mapping/redirect?result=map&id=${encodeURIComponent(nebisId)}`;

    return this.http.get<any>(url).pipe(
      map(response => response || null),
      catchError(error => {
        if (error.status === 404) return of(null);
        this.ethErrorHandlingService.handleError(error, 'EthComposeNbService.getPrintData');
        return of(null);
      })
    );
  }

  // https://daas.library.ethz.ch/rib/v3/search?q=any,contains,oai:agora.ch:004464904
  getOnlineData(oaiId: string) {
    const url = `${this.baseUrl}/search?limit=50&q=any,contains,${encodeURIComponent(oaiId)}`;

    return this.http.get<any>(url).pipe(
      map(response => response || null),
      catchError(error => {
        if (error.status === 404) return of(null);
        this.ethErrorHandlingService.handleError(error, 'EthComposeNbService.getOnlineData');
        return of(null);
      })
    );
  }
}

