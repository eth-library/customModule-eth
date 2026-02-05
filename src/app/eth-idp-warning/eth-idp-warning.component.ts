// If a user with an ETH email address does not belong to an ETH user group, a message will be displayed stating that the user must link their edu-id account to their ETH account.
// https://jira.ethz.ch/browse/SLSP-1985

import { Component, OnInit } from '@angular/core';
import { catchError, combineLatest, map, Observable, of, take, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from "@ngx-translate/core";


@Component({
  selector: 'custom-eth-idp-warning',
  templateUrl: './eth-idp-warning.component.html',
  styleUrls: ['./eth-idp-warning.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    TranslateModule
  ]      
})

export class EthIdpWarningComponent implements OnInit {

  showWarning$!: Observable<boolean>;

  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  ngOnInit(): void {
    this.showWarning$ = combineLatest([
      this.ethStoreService.userGroup$,
      this.ethStoreService.email$,
      this.ethStoreService.authenticationProfile$
    ])
    .pipe(
      map(([group, email, profile]) =>
        this.showWarning(group, email, profile)
      ),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthIdpWarningComponent');
        return of(false);
      })
    )
  }
  
  private showWarning(group: string | null, email: string | null, profile: string | null): boolean {
    if (profile === 'Alma') return false;
    if (!email) return false;
    
    const ethMemberGroups = [
      'ETH_Member',
      'ETH_E06_GESS-Member',
      'ETH_E64_MATH-Member',
      'ETH_Student'
    ];
    
    const isETHMember = group ? ethMemberGroups.includes(group) : false;
    return !isETHMember && email?.includes('ethz.ch');
  }

}
