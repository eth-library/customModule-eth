// If a user with an ETH email address does not belong to an ETH user group,
// a message will appear stating that the user must link their edu-id account to their ETH account.
// This message appears in two places:
//    - Start of the Request section
//    - Account - Settings
// https://jira.ethz.ch/browse/SLSP-1985

import { Component, inject } from '@angular/core';
import { catchError, combineLatest, defer, map, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';


@Component({
  selector: 'custom-eth-idp-warning',
  templateUrl: './eth-idp-warning.component.html',
  styleUrls: ['./eth-idp-warning.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]      
})

export class EthIdpWarningComponent {
  private ethStoreService = inject(EthStoreService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  
  showWarning$: Observable<boolean> = defer(() =>
    this.ethStoreService.isLoggedIn$.pipe(
      switchMap(isLoggedIn => {
        if (!isLoggedIn) {
          return of(false);
        }

        return combineLatest([
          this.ethStoreService.email$,
          this.ethStoreService.authenticationProfile$,
          this.ethStoreService.isEthMember()
        ]).pipe(
          map(([email, profile, isETHMember]) => this.showWarning(email, profile, isETHMember)),
          catchError(error => {
            this.ethErrorHandlingService.logError(error, 'EthIdpWarningComponent.showWarning$ map');
            return of(false);
          })
        );
      }),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthIdpWarningComponent.showWarning$ outer');
        return of(false);
      })
    )
  );
  
  private showWarning(email: string | null, profile: string | null, isETHMember: boolean): boolean {
    if (profile === 'Alma') return false;
    if (!email) return false;
    return !isETHMember && email?.includes('ethz.ch');
  }

}
