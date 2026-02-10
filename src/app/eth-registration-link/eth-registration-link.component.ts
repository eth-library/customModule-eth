// In the login box, there is a link that says “Not registered yet?”
// https://jira.ethz.ch/browse/SLSP-1984

import { Component, inject, Renderer2, DestroyRef, Inject } from '@angular/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, of, take, tap } from 'rxjs';

const REGISTRATION_URL = 'https://library.ethz.ch/recherchieren-und-nutzen/ausleihen-und-nutzen/swisscovery-hilfe-auf-einen-blick.html#r';
const LINK_SELECTOR = 'nde-login-dialog .eth-registration-link';
const CONTENT_SELECTOR = 'nde-login-dialog .mat-mdc-dialog-content';

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
       private ethErrorHandlingService: EthErrorHandlingService,
       @Inject(DOCUMENT) private document: Document    
    ){}

    ngAfterViewInit(): void {
      const loginFormContent = this.document.querySelector('nde-login-form-content') as HTMLElement | null;
      if (!loginFormContent) return;

      this.insertEthRegistrationLink(loginFormContent);
      this.observeDialogChanges(loginFormContent);
    }

    private observeDialogChanges(loginFormContent: HTMLElement): void {
      const observer = new MutationObserver((mutations) => {
        if (loginFormContent.querySelector('.eth-registration-link')) return;

        const isMethodsDialog = mutations.some(m =>
          Array.from(m.addedNodes).some(node =>
            node instanceof HTMLElement &&
            node.matches?.('.authentication-method-btn')
          )
        );
        if (isMethodsDialog) {
          this.insertEthRegistrationLink(loginFormContent);
        }
      });

      observer.observe(loginFormContent, { childList: true, subtree: true });
      this.destroyRef.onDestroy(() => observer.disconnect());
    }

    private insertEthRegistrationLink(loginFormContent: HTMLElement): void{
      try {
        this.translate
          .get(['eth.registrationLink.linkText', 'nui.aria.newWindow'])
          .pipe(
            take(1),
            tap(translations => {
              const linktext = translations['eth.registrationLink.linkText'];
              const newWindow = translations['nui.aria.newWindow'];
              
              const existingLink = loginFormContent.querySelector(LINK_SELECTOR);
              if (existingLink) return;

              const container = loginFormContent.querySelector(CONTENT_SELECTOR);
              if (!container) return;

              const link = this.buildRegistrationLink(linktext, newWindow);
              this.renderer.insertBefore(container.parentNode, link, container.nextSibling);
            }),
            catchError(err => {
              this.ethErrorHandlingService.logError(err,'EthRegistrationLinkComponent translateStream');
              return of(null);
            })
          )
          .subscribe();
      } 
      catch (error) {
        this.ethErrorHandlingService.logSyncError(error,'EthRegistrationLinkComponent.ngAfterViewInit()');
      }
    }

    private buildRegistrationLink(linktext: string, newWindow: string): HTMLElement {
      const link = this.renderer.createElement('a');
      this.renderer.setAttribute(link, 'href', REGISTRATION_URL);
      this.renderer.setAttribute(link, 'target', '_blank');
      this.renderer.setAttribute(link, 'aria-label', `${linktext} ${newWindow}`);
      this.renderer.addClass(link, 'eth-registration-link');
      this.renderer.appendChild(link, this.renderer.createText(linktext));

      const svg = this.buildExternalLinkIcon();
      this.renderer.appendChild(link, svg);

      return link;
    }

    private buildExternalLinkIcon(): HTMLElement {
      const svg = this.renderer.createElement('svg', 'svg');
      this.renderer.setAttribute(svg, 'xmlns', 'http://www.w3.org/2000/svg');
      this.renderer.setAttribute(svg, 'viewBox', '0 -960 960 960');
      this.renderer.setAttribute(svg, 'aria-hidden', 'true');
      this.renderer.setAttribute(svg, 'focusable', 'false');

      const path = this.renderer.createElement('path', 'svg');
      this.renderer.setAttribute(path, 'd', 'm256-240-56-56 384-384H240v-80h480v480h-80v-344L256-240Z');
      this.renderer.appendChild(svg, path);

      return svg;
    }

}
