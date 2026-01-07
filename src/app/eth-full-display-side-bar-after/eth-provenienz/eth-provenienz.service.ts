import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthProvenienzResponse } from '../../models/eth.model';


@Injectable({
  providedIn: 'root'
})
export class EthProvenienzService {

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  // https://daas.library.ethz.ch/rib/v3/ba/provenienz/doi?doi=10.3931/e-rara-9423
  getItems( doi:string ): Observable<EthProvenienzResponse | null> {
    if (!doi) {
      return of(null);
    }
    return this.httpClient.get<EthProvenienzResponse | null>(`https://daas.library.ethz.ch/rib/v3/ba/provenienz/doi?doi=${encodeURIComponent(doi)}`).pipe(
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthProvenienzService');
        return of(null);
      })
    )
  }  

}
