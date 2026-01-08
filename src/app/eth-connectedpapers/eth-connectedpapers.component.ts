// For articles and book_chapters, a link to Connected Papers is provided via the DOI.
// https://jira.ethz.ch/browse/SLSP-1981

import { Component, Input } from '@angular/core';
import { EthConnectedpapersService } from './eth-connectedpapers.service'
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import { ConnectedPapersAPIResponse, Doc } from '../models/eth.model';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { HostComponent } from '..//models/eth.model';

@Component({
  selector: 'custom-eth-connectedpapers',
  templateUrl: './eth-connectedpapers.component.html',
  styleUrl: './eth-connectedpapers.component.scss',
  standalone: true,
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]    
})

export class EthConnectedpapersComponent{
  @Input() hostComponent: HostComponent = {};
  paperUrl$!: Observable<string | null>;

  constructor(
    private ethConnectedpapersService: EthConnectedpapersService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethStoreService:EthStoreService
  ){}


  ngOnInit() {
    if(!this.hostComponent?.searchResult)return;
    this.paperUrl$ = this.ethStoreService.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getPaper(record))
    )
  }
  
  private getPaper(record: Doc): Observable<string  | null> {    
    try{
      const doi = this.getDoi(record);
      if (!doi) {
        return of(null);
      }
      const type = this.getType(record);
      if (type !== 'article' && type !== 'articles' && type !== 'book_chapter') {
        return of(null);
      }

      return this.ethConnectedpapersService.getPaper(doi).pipe(
        filter((response): response is ConnectedPapersAPIResponse => response !== null),
        map(response => {
            if((response?.citationCount && response?.citationCount > 0) || (response?.referenceCount && response?.referenceCount > 0)){
                return `https://www.connectedpapers.com/main/${response.id}/graph?utm_source=primonde`;
            }
            else{
              return null;
            }
        }),
        catchError((error) => {
          this.ethErrorHandlingService.handleError(error, 'EthConnectedpapersComponent ethConnectedpapersService.getPaper()')
          return of(null);
        })
      );
    }
    catch(error: any){
        this.ethErrorHandlingService.handleSynchronError(error, 'EthConnectedpapersComponent.getPaper()');  
        return of(null);
    }
  }

  private getType(record: Doc): string | null {
    return record?.pnx?.display?.type?.[0] || null;
  }  

  private getDoi(record: Doc): string | null {
    return record?.pnx?.addata?.doi?.[0] || null;
  }  

}

  
