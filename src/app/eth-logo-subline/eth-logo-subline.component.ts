// create a subline below ETH Logo
// https://jira.ethz.ch/browse/SLSP-2009

import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
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
  private router = inject(SHELL_ROUTER);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private ethStoreService = inject(EthStoreService);
  private translate = inject(TranslateService);

  ngOnInit() {
    try {
      const vid = this.ethStoreService.getVid() ?? '';
      const lang = this.translate.currentLang ?? 'de';
      this.url = `/home?lang=${lang}&vid=${vid}`;
    }
    catch (error) {
      this.ethErrorHandlingService.logError(error, 'EthLogoSublineComponent.ngOnInit()');
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
