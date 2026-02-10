// Integration OKM
// https://jira.ethz.ch/browse/SLSP-1989

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { catchError, defer, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import {TranslateModule} from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Component({
  selector: 'custom-eth-okm',
  templateUrl: './eth-okm.component.html',
  styleUrls: ['./eth-okm.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    TranslateModule
  ]    
})
export class EthOKMComponent {
  searchValue$: Observable<string | null> = defer(() =>
    this.ethStoreService.isFullview$().pipe(
      switchMap(isFullview =>
        !isFullview
          ? this.ethStoreService.searchValue$
          : of(null)
      ),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthOKMComponent.searchValue$');
        return of(null);
      })
    )
  );

  constructor(
    private ethStoreService: EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  encode(value: string | null): string {
    return value ? encodeURIComponent(value) : '';
  }
    
}