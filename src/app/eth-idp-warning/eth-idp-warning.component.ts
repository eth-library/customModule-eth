import { Component, OnInit } from '@angular/core';
import { combineLatest, map, Observable, of, take, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import {TranslateModule} from "@ngx-translate/core";


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
    private translate: TranslateService,
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
        this.showWarning(group ?? '', email ?? '', profile ?? '')
      )
    )
  }

  private showWarning(group: string, email: string, profile: string): boolean {
    if (profile === 'AlmaTEMP') return false;
    const ethMemberGroups = [
      'ETH_Member',
      'ETH_E06_GESS-Member',
      'ETH_E64_MATH-Member',
      'ETH_Student'
    ];
    const isETHMember = ethMemberGroups.includes(group);
    if (!isETHMember && email?.includes('ethz.ch') && !email.includes('retired.ethz.ch')) {
      return true;
    }
    return false;
  }    

}
