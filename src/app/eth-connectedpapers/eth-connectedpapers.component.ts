// For articles and book_chapters, a link to Connected Papers is provided via the DOI.
// https://jira.ethz.ch/browse/SLSP-1981

import { Component, Input } from '@angular/core';
import { EthConnectedpapersService } from './eth-connectedpapers.service'
import { catchError, defer, filter, map, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import { ConnectedPapersAPIResponse, PnxDoc } from '../models/eth.model';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { HostComponent } from '../models/eth.model';

@Component({
  selector: 'custom-eth-connectedpapers',
  templateUrl: './eth-connectedpapers.component.html',
  styleUrls: ['./eth-connectedpapers.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]    
})

export class EthConnectedpapersComponent{
  @Input() hostComponent: HostComponent = {};
  
  paperUrl$: Observable<string | null> = defer(() => {
    if (!this.hostComponent?.searchResult) {
      return of(null);
    }

    return this.ethStoreService.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getPaper(record)),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthConnectedpapersComponent.paperUrl$');
        return of(null);
      })
    );
  });

  constructor(
    private ethConnectedpapersService: EthConnectedpapersService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethStoreService:EthStoreService
  ){}


  private getPaper(record: PnxDoc): Observable<string  | null> {    
    const doi = this.getDoi(record);
    if (!doi) {
      return of(null);
    }

    const type = this.getType(record);
    const allowedTypes = new Set(['article', 'articles', 'book_chapter']);
    if (!type || !allowedTypes.has(type)) {
      return of(null);
    }

    return this.ethConnectedpapersService.getPaper(doi).pipe(
      filter((response): response is ConnectedPapersAPIResponse => response !== null), 
      map(response => {
        const hasCitations = !!response.citationCount && response.citationCount > 0;
        const hasReferences = !!response.referenceCount && response.referenceCount > 0;
        if (!hasCitations && !hasReferences) {
          return null;
        }
        return `https://www.connectedpapers.com/main/${response.id}/graph?utm_source=primonde`;
      }),
      catchError((error) => {
        this.ethErrorHandlingService.logError(error, 'EthConnectedpapersComponent ethConnectedpapersService.getPaper()')
        return of(null);
      })
    );
  }

  private getType(record: PnxDoc): string | null {
    return record?.pnx?.display?.type?.[0] || null;
  }  

  private getDoi(record: PnxDoc): string | null {
    return record?.pnx?.addata?.doi?.[0] || null;
  }  

}

  
