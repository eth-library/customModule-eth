import { Component, Renderer2 } from '@angular/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'custom-eth-registration-link',
  templateUrl: './eth-registration-link.component.html',
  styleUrls: ['./eth-registration-link.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    TranslateModule
  ]      
})
export class EthRegistrationLinkComponent {

  constructor(
       private renderer: Renderer2,

       private ethErrorHandlingService: EthErrorHandlingService
    ){}

    ngAfterViewInit(): void {
      try{
        //const container = this.renderer.selectRootElement('nde-login-dialog .authentication-method-btn:nth-child(1)', true);
        /*
        const container = this.renderer.selectRootElement('nde-login-dialog .mat-mdc-dialog-content', true);
        const link = this.renderer.createElement('a');
        this.renderer.setAttribute(link, 'href', 'https://library.ethz.ch/recherchieren-und-nutzen/ausleihen-und-nutzen/swisscovery-hilfe-auf-einen-blick.html#r');
        this.renderer.setAttribute(link, 'target', '_blank');
        this.renderer.addClass(link, 'eth-registration-link');
        this.renderer.appendChild(link, this.renderer.createText('Noch nicht registriert?'));
        this.renderer.insertBefore(container.parentNode, link, container.nextSibling);
        */
      } 
      catch(error: any){
        return this.ethErrorHandlingService.handleSynchronError(error, 'EthRegistrationLinkComponent');  
      }      
    }

}
