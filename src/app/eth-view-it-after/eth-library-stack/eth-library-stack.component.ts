import { Component, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { catchError, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
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
   
  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private renderer: Renderer2,
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
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthLibraryStackComponent');
        return of(false);
      })      
    )
    // .pipe(takeUntilDestroyed()) todo
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
          const newDiv2 = this.renderer.createElement('div');
          this.renderer.setStyle(newDiv2, 'padding-left', '6px');
          this.renderer.setStyle(newDiv2, 'font-size', '14px');
          const text2 = this.renderer.createText('You need to register with your ETH Zurich e-mail address "Sign In". Access to this source is restricted on the domain ethz.ch because of license restrictions.');
          this.renderer.appendChild(newDiv2, text2);
          this.renderer.insertBefore(btn.parentNode, newDiv2, btn.nextSibling);   

          const newDiv = this.renderer.createElement('div');
          this.renderer.setStyle(newDiv, 'padding-left', '6px');
          this.renderer.setStyle(newDiv, 'color', 'var(--sys-primary)');
          this.renderer.setStyle(newDiv, 'font-size', '14px');
          const text = this.renderer.createText('Password protected access. Restricted to members of ETH Zurich only.');
          this.renderer.appendChild(newDiv, text);
          this.renderer.insertBefore(btn.parentNode, newDiv, btn.nextSibling);
        }
      }
    });
    observer.observe(this.document.body, { childList: true, subtree: true });
  }
  
}

/*
        label: {
            hint1:{
                de: 'Password protected access. Restricted to members of ETH Zurich only.',
                en: 'Password protected access. Restricted to members of ETH Zurich only.'
            },
            hint2:{
                de: 'You need to register with your ETH Zurich e-mail address "Sign In". Access to this source is restricted on the domain ethz.ch because of license restrictions.',
                en: 'You need to register with your ETH Zurich e-mail address "Sign In". Access to this source is restricted on the domain ethz.ch because of license restrictions.'
            }
        }
 */