import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthProvenienzAPIResponse } from '../../models/eth.model';


@Injectable({
  providedIn: 'root'
})
export class EthProvenienzService {

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  // https://daas.library.ethz.ch/rib/v3/ba/provenienz/doi?doi=10.3931/e-rara-9423
  getItems( doi:string ): Observable<EthProvenienzAPIResponse> {
    return this.httpClient.get<EthProvenienzAPIResponse>(`https://daas.library.ethz.ch/rib/v3/ba/provenienz/doi?doi=${encodeURIComponent(doi)}`).pipe(
      catchError((e) => {
          this.ethErrorHandlingService.logError(e, 'EthProvenienzService.getItems()');
          return throwError(() => e);
      })      
    )
  }  

}
