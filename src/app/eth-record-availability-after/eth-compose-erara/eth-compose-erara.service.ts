import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, throwError  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EraraEMapsMapAPIResponse, PrimoApiResponse } from '../../models/eth.model';

@Injectable({
  providedIn: 'root'
})
export class EthComposeEraraService {
  
  private readonly baseUrl = 'https://daas.library.ethz.ch/rib/v3';

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  // https://daas.library.ethz.ch/rib/v3/search?q=any,contains,MMS_ID_PRINT_990042488650205503
  getOnlineEraraRecord(mmsid: string): Observable<PrimoApiResponse | null> {
    const url = `${this.baseUrl}/search?q=any,contains,MMS_ID_PRINT_${encodeURIComponent(mmsid)}`;
    return this.httpClient.get<PrimoApiResponse>(url).pipe(
      catchError(e => {
        if (e.status === 404) return of(null);
        this.ethErrorHandlingService.logError(e, 'EthComposeEraraService.getOnlineEraraRecord');
        return throwError(() => e);
      })
    );
  }
  
  // https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?emap=99117999050805503
  getEraraRecordForEMap(mmsid: string): Observable<EraraEMapsMapAPIResponse | null> {
    const url = `${this.baseUrl}/graph/emaps-erara?emap=${encodeURIComponent(mmsid)}`;
    return this.httpClient.get<EraraEMapsMapAPIResponse>(url).pipe(
      catchError(e => {
        if (e.status === 404) return of(null);
        this.ethErrorHandlingService.logError(e, 'EthComposeEraraService.getEraraRecordForEMap');
        return throwError(() => e);
      })
    );
  }
  
  // https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?erara=990038990900205503
  getEMapsRecord(mmsid: string): Observable<EraraEMapsMapAPIResponse | null> {
    const url = `${this.baseUrl}/graph/emaps-erara?erara=${encodeURIComponent(mmsid)}`;
    return this.httpClient.get<EraraEMapsMapAPIResponse>(url).pipe(
      catchError(e => {
        if (e.status === 404) return of(null);
        this.ethErrorHandlingService.logError(e, 'EthComposeEraraService.getEMapsRecord');
        return throwError(() => e);
      })
    );
  }

}
