// 
// https://jira.ethz.ch/browse/SLSP-2009

// id attribute is used for router.navigateByUrl() -> go to the top of the page  

import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from 'src/app/services/eth-error-handling.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from "../injection-tokens";

@Component({
  selector: 'custom-eth-logo-subline',
  standalone: true,
  templateUrl: './eth-logo-subline.component.html',
  styleUrls: ['./eth-logo-subline.component.scss'],
  imports: [
    CommonModule,
    TranslateModule
  ]        
})
export class EthLogoSublineComponent implements OnInit {
  url: string  = '';

  constructor(
    @Inject(SHELL_ROUTER) private router: Router,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethStoreService:EthStoreService,     
    private translate: TranslateService    
  ) {}

  ngOnInit() {
    try {
      const vid = this.ethStoreService.getVid() ?? '';
      const lang = this.translate.currentLang ?? 'de';
      this.url = `/home?lang=${lang}&vid=${vid}`;
    } catch (error) {
      this.ethErrorHandlingService.logSyncError(error, 'EthLogoSublineComponent.ngOnInit()');
    }
  }

  navigate(event: Event){
    event.preventDefault(); 
    if (!this.url) {
      return;
    }
    this.router.navigateByUrl(this.url);
  }     
  
}
