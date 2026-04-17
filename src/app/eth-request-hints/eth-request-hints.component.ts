//
//
//
// https://jira.ethz.ch/browse/SLSP-2013

import { Component, Input } from '@angular/core';
import { BehaviorSubject, combineLatest, defer, map, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { EthStoreService } from '../services/eth-store.service';
import { HostComponent } from '../models/eth.model';

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
  private hostComponent$ = new BehaviorSubject<HostComponent>({});

  @Input() 
  set hostComponent(value: HostComponent) {
    this.hostComponent$.next(value);
  }

  formType$: Observable<string | null> = defer(() => 
    this.hostComponent$.pipe(
      map(hostComponent => {
          return hostComponent?.formType ?? null;
        }
      )
    )
  )

  userGroup$: Observable<string | null> = defer(() => this.ethStoreService.userGroup$ );


  readonly vm$ = combineLatest({
    formType: this.formType$,
    userGroup: this.userGroup$,
  }).pipe(
    map(({ formType, userGroup }) => ({
      formType,
      userGroup,
      hint: this.getHint(formType, userGroup),
    }))
  );


  private getHint(formType: string | null, userGroup: string | null): Observable<any> | null {
    /* userGroup
    - 'ETH_Member', 'ETH_E06_GESS-Member', 'ETH_E64_MATH-Member',
    - 'ETH_Student'    
    - other
    */
    /* formType:
      AlmaDigitization, AlmaRequest, AlmaRequestOther
    */   
    if (formType === 'AlmaDigitization' && userGroup === 'ETH_Member') 
      return this.translate.get('hint.digitization.member');
    else if (formType === 'AlmaRequest') 
      return this.translate.get('eth.illLink.text1');
    else if (formType === 'AlmaRequestOther') 
      return this.translate.get('eth.illLink.text1');
    return null;
  }


  constructor(
    private ethStoreService: EthStoreService,
    private translate: TranslateService,
  ) {}

}
