import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of  } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';

interface EthProvenienzItem {
  id: string;
  eth_doi_link: string;
  eth_license: string;
  eth_link_to_the_digital_version_in_e_rara: string;
  eth_copyright_notice: string;
  eth_dating: string;
  description: string;
  title: string;
}

interface EthProvenienzResponse {
  items: EthProvenienzItem[];
}

@Injectable({
  providedIn: 'root'
})
export class EthProvenienzService {

  constructor(
    private httpClient: HttpClient,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  // https://daas.library.ethz.ch/rib/v3/ba/provenienz/doi?doi=10.3931/e-rara-9423
  getItems(doi:string): Observable<EthProvenienzResponse | null> {
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
