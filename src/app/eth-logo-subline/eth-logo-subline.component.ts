import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from 'src/app/services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from "../injection-tokens";

@Component({
  selector: 'custom-eth-logo-subline',
  standalone: true,
  templateUrl: './eth-logo-subline.component.html',
  styleUrls: ['./eth-logo-subline.component.scss'],
  imports: [
    CommonModule,
  ]        
})
export class EthLogoSublineComponent {
  private router = inject(SHELL_ROUTER);  
  url: string  = '';

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethStoreService:EthStoreService,     
    private translate: TranslateService    
  ) {}

  ngOnInit() {
    try {
      let vid = this.ethStoreService.getVid();
      let lang = this.translate.currentLang;
      this.url = `/home?lang=${lang}&vid=${vid}`;
    } catch (error) {
      this.ethErrorHandlingService.handleSynchronError(error, 'EthLogoSublineComponent.ngOnInit()');
    }
  }

  navigate(event: Event){
    event.preventDefault(); 
    this.router.navigateByUrl(this.url);
  }     
  
}
