// Integration OKM
// https://jira.ethz.ch/browse/SLSP-1989

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
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
export class EthOKMComponent implements OnInit {
  searchValue$!: Observable<string | null>;

  constructor(
    private ethStoreService: EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngOnInit(): void {
    this.searchValue$ = this.ethStoreService.isFullview$().pipe(
      switchMap(isFullview => 
        !isFullview 
          ? this.ethStoreService.searchValue$
          : of(null)
      ),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthOKMComponent.ngOnInit');
        return of(null);
      })
    )
  }

  encode(value: string | null): string {
    return value ? encodeURIComponent(value) : '';
  }
    
}