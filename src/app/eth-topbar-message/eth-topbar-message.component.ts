/**
A message for the topbar is retrieved from the codetables.
The message is inserted as HTML (link as link, not as HTML code).
Only certain tags/attributes are allowed in the message.
For security reasons, all other elements/attributes are removed.

If the value is NOT_DEFINED: message='' -> !message = falsy
If the code does not exist: message = 'eth.topbarMessage.message'

*/
// https://jira.ethz.ch/browse/SLSP-1958


import { Component, inject } from '@angular/core';
import { catchError,  map, Observable, of, switchMap } from 'rxjs';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthStoreService } from '../services/eth-store.service';
import { EthUtilsService } from '../services/eth-utils.service';


@Component({
  selector: 'custom-eth-topbar-message',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],   
  templateUrl: './eth-topbar-message.component.html',
  styleUrl: './eth-topbar-message.component.scss'
})
export class EthTopbarMessageComponent {
  private translate = inject(TranslateService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private ethUtilsService = inject(EthUtilsService);
  private ethStoreService = inject(EthStoreService);

  vid = this.ethStoreService.getVid();

  message$: Observable<SafeHtml | null> = this.translate.stream('eth.topbarMessage.message')
      .pipe(
        map( (message) => {
          // if NOT_DEFINED: message='' -> !message = falsy
          // if code does not exist: message = 'eth.topbarMessage.message'
          if(!message || message === 'eth.topbarMessage.message'){
            return null;
          }
          return this.ethUtilsService.sanitizeHtml(message);
        }),
        catchError(error => {
          this.ethErrorHandlingService.logError(error, 'EthTopbarMessageComponent');
          return of(null);
        })
      );
}

/*
<h1 id="git-hint-heading" class="eth-visually-hidden">Wichtiger Hinweis</h1>
<div role="alert" aria-labelledby="git-hint-heading" class="eth-git-hint-container">
✨Bücherbestellungen unter 'Weitere Bestelloptionen' momentan nicht möglich. 
<a href="https://library.ethz.ch/recherchieren-und-nutzen/research-assistant.html" target="_blank">Mehr erfahren</a>
</div>
 */