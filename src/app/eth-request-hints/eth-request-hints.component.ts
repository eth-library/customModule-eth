// The order form displays information on fees (for different user groups),
// depending on whether the request is made via ETH-GetIt or Pickup from other institutions’, 
// and varies for requests and digitisation (formType).
// https://jira.ethz.ch/browse/SLSP-2013

// 990061118830205503  
// 990002638940205503

import { Component, inject, Input } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { HostComponent } from '../models/eth.model';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthUtilsService } from '../services/eth-utils.service';

@Component({
  selector: 'custom-eth-request-hints',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './eth-request-hints.component.html',
  styleUrl: './eth-request-hints.component.scss'
})
export class EthRequestHintsComponent {
  private translate = inject(TranslateService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private ethUtilsService = inject(EthUtilsService);

  private hostComponent$ = new BehaviorSubject<HostComponent>({});

  @Input() 
  set hostComponent(value: HostComponent) {
    this.hostComponent$.next(value);
  }

  readonly state$: Observable<{ formType: string | null; pickupAtETH: boolean }> = this.hostComponent$.pipe(
    map(hc => ({
      formType: hc?.formType ?? null,
      pickupAtETH: hc?.data?.request?.['link-to-service']?.includes('institution=41SLSP_ETH') ?? false,
    }))
  );

  readonly hint$ = this.state$.pipe(
    switchMap(({ formType, pickupAtETH }) =>
      this.getHint(formType, pickupAtETH).pipe(
        map(hint => this.ethUtilsService.sanitizeHtml(hint)),
        catchError(err => {
          this.ethErrorHandlingService.logError(err, 'EthRequestHintsComponent');
          return of(null);
        })
      )
    )
  );      
  
  private getHint(formType: string | null, pickupAtETH: boolean): Observable<string | null> {
    if (pickupAtETH && (formType === 'AlmaRequest' || formType === 'AlmaRequestOther' || formType === 'AlmaItemRequest')) {
      return this.translate.stream('eth.requestHint.request');
    }
    else if (pickupAtETH && (formType === 'AlmaDigitization' || formType === 'AlmaDigitizationOther' || formType === 'AlmaItemDigitization')) {
      return this.translate.stream('eth.requestHint.digitization');
    }
    else if (!pickupAtETH && (formType === 'AlmaRequest' || formType === 'AlmaRequestOther' || formType === 'AlmaItemRequest')) {
      return this.translate.stream('eth.requestHint.requestOtherLibrary');
    }
    else if (!pickupAtETH && (formType === 'AlmaDigitization' || formType === 'AlmaDigitizationOther' || formType === 'AlmaItemDigitization')) {
      return this.translate.stream('eth.requestHint.digitizationOtherLibrary');
    }
    else{
      return of(null);
    }
  }




}

/*
AlmaRequest   
Deutsch
Abholung vor Ort: kostenlos<br>Postversand: CHF 12.00 (kostenlos an ETH-Institutsadresse)

Englisch
Pickup on site: free of charge<br>Postal delivery: CHF 12.00 (free of charge to ETH institutional address)



AlmaRequestOther
Deutsch
Abholung vor Ort: kostenlos<br>Postversand: CHF 12.00

Englisch
Pickup on site: free of charge<br>Postal delivery: CHF 12.00



AlmaDigitization
Deutsch
Normale Gebühr: CHF 5.00<br>ETH-Mitarbeitende: kostenlos<br>Alle Studierende: CHF 2.50<br>Kommerzielle Unternehmen: CHF 25.00

Englisch
Normal fee: CHF 5.00<br>ETH employees: free of charge<br>All students: CHF 2.50<br>Commercial clients: CHF 25.00



AlmaDigitizationOther
Deutsch
Normale Gebühr: CHF 5.00<br>Kommerzielle Unternehmen: CHF 25.00

Englisch
Normal fee: CHF 5.00<br>Commercial clients: CHF 25.00

*/