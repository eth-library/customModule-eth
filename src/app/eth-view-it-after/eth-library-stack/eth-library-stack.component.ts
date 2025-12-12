// Librarystack: A note is inserted. (Password-protected access. Restricted to members of ETH Zurich only...)
// https://jira.ethz.ch/browse/SLSP-1999

import { Component, Inject, Renderer2, DestroyRef, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { catchError, filter, map, Observable, of, take, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'custom-eth-library-stack',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './eth-library-stack.component.html',
  styleUrls: ['./eth-library-stack.component.scss']
})
export class EthLibraryStackComponent {

  showHint$!: Observable<boolean>;
  private destroyRef = inject(DestroyRef);
   
  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private renderer: Renderer2,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document    
  ){}

  ngAfterViewInit() {
    // cdi_librarystack_primary_159090
    this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
      //tap(deliveryEntity => {console.error("deliveryEntity",deliveryEntity)}),
      map(deliveryEntity => {
        return deliveryEntity?.delivery?.link?.some(
          (e:any) => {return e.linkURL?.includes('www.librarystack.org')}
        ) ?? false;
      }),
      filter(hasLibraryStackUrl => hasLibraryStackUrl),
      take(1),
      tap(() => this.changeDOM()),
      takeUntilDestroyed(this.destroyRef),  
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthLibraryStackComponent');
        return of(false);
      })      
    )
    .subscribe();
  }

  changeDOM() {
    const observer = new MutationObserver(() => {
      const btnH5 = this.document.querySelector('nde-view-it-card button h5');
      if (btnH5) {
        observer.disconnect();
        //this.renderer.setProperty(btnH5, 'textContent', 'Zugriff auf Inhalte in Library Stack');
        const btn = this.document.querySelector('nde-view-it-card button');
        if (btn && btn.parentNode) {
          this.translate.stream([
            'eth.libraryStack.text1',
            'eth.libraryStack.text2'
          ]).pipe(
            tap(translations => {
              const text1 = translations['eth.libraryStack.text1'];
              const text2 = translations['eth.libraryStack.text2'];

              const btn = this.document.querySelector('nde-view-it-card button');
              if (btn && btn.parentNode) {
                const existingDivs = btn.parentNode.querySelectorAll('.eth-libstack-text');
                existingDivs.forEach(div => div.remove());

                const newDiv2 = this.renderer.createElement('div');
                this.renderer.addClass(newDiv2, 'eth-librarystack-text2');
                this.renderer.appendChild(newDiv2, this.renderer.createText(text2));
                this.renderer.insertBefore(btn.parentNode, newDiv2, btn.nextSibling);

                const newDiv1 = this.renderer.createElement('div');
                this.renderer.addClass(newDiv1, 'eth-librarystack-text1');
                this.renderer.appendChild(newDiv1, this.renderer.createText(text1));
                this.renderer.insertBefore(btn.parentNode, newDiv1, btn.nextSibling);
              }
            }),
            takeUntilDestroyed(this.destroyRef)
          ).subscribe();          
        }
      }
    });
    const el = this.document.querySelector('nde-full-display-container') as HTMLElement;
    observer.observe(el, { childList: true, subtree: true });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
  
}