// In the login box, there is a link next to the switch option that says “Not registered yet?”
// https://jira.ethz.ch/browse/SLSP-1984

import { Component, inject, Renderer2, DestroyRef } from '@angular/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, of, tap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
  
  private destroyRef = inject(DestroyRef);

  constructor(
       private renderer: Renderer2,
       private translate: TranslateService,
       private ethErrorHandlingService: EthErrorHandlingService
    ){}

    ngAfterViewInit(): void {
      try {
        this.translate
          .stream(['eth.registrationLink.linkText', 'nui.aria.newWindow'])
          .pipe(
            tap(translations => {
              const linktext = translations['eth.registrationLink.linkText'];
              const newWindow = translations['nui.aria.newWindow'];

              // check if alredy exists
              const existingLink = document.querySelector('nde-login-dialog .eth-registration-link');
              if (existingLink) {
                return;
              }

              const container = this.renderer.selectRootElement('nde-login-dialog .mat-mdc-dialog-content',true);
              const link = this.renderer.createElement('a');
              this.renderer.setAttribute(link,'href','https://library.ethz.ch/recherchieren-und-nutzen/ausleihen-und-nutzen/swisscovery-hilfe-auf-einen-blick.html#r');
              this.renderer.setAttribute(link, 'target', '_blank');
              this.renderer.setAttribute(link, 'aria-label', `${linktext} ${newWindow}`);
              this.renderer.addClass(link, 'eth-registration-link');
              this.renderer.appendChild(link, this.renderer.createText(linktext));

              // create svg
              const svg = this.renderer.createElement('svg', 'svg');
              this.renderer.setAttribute(svg, 'xmlns', 'http://www.w3.org/2000/svg');
              this.renderer.setAttribute(svg, 'viewBox', '0 -960 960 960');
              this.renderer.setAttribute(svg, 'aria-hidden', 'true');
              this.renderer.setAttribute(svg, 'focusable', 'false');
              const path = this.renderer.createElement('path', 'svg');
              this.renderer.setAttribute(path,'d','m256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z');

              // append svg to link
              this.renderer.appendChild(svg, path);
              this.renderer.appendChild(link, svg);

              // insert link
              this.renderer.insertBefore(container.parentNode, link, container.nextSibling);
            }),
            takeUntilDestroyed(this.destroyRef),
            catchError(err => {
              this.ethErrorHandlingService.handleError(err,'EthRegistrationLinkComponent translateStream');
              return of(null);
            })
          )
          .subscribe();
      } catch (error) {
        return this.ethErrorHandlingService.handleSynchronError(
          error,
          'EthRegistrationLinkComponent.ngAfterViewInit()'
        );
      }
    }


}
