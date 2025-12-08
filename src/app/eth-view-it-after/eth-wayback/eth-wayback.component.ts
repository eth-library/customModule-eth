import { Component, DestroyRef, inject, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { catchError, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from "@ngx-translate/core";


@Component({
  selector: 'custom-eth-wayback',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './eth-wayback.component.html',
  styleUrls: ['./eth-wayback.component.scss']
})
export class EthWaybackComponent {

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
    // 99117429500405503
    this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
      //tap(deliveryEntity => {console.error("deliveryEntity",deliveryEntity)}),
      map(deliveryEntity => {
        return deliveryEntity?.delivery?.link?.some(
          (e:any) => {return e.linkURL?.includes('https://wayback.archive-It.org')}
        ) ?? false;
      }),
      filter(hasWaybackUrl => hasWaybackUrl),
      // using take(1) laguage switch do not work
      //take(1),
      tap(() => this.changeDOM()),
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthWaybackComponent');
        return of(false);
      })      
    )
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe();
  }

  changeDOM() {
    const observer = new MutationObserver(() => {
      const btnH5 = this.document.querySelector('nde-view-it-card button h5');
      const btn = this.document.querySelector('nde-view-it-card button');
      if (btnH5 && btn && btn.parentNode && !this.document.getElementById('eth-wayback-hint')) {
        observer.disconnect();
        this.translate.stream([
          'eth.wayback.text',
          'eth.wayback.linkText'
        ]).pipe(
          tap(translations => {
            const labelText = translations['eth.wayback.text'];
            const labelLinkText = translations['eth.wayback.linkText'];
            this.renderer.setProperty(btnH5, 'textContent', labelLinkText);
            this.renderer.setAttribute(btnH5, 'aria-label', labelLinkText);
            const newDiv = this.renderer.createElement('div');
            this.renderer.setStyle(newDiv, 'padding-left', '6px');
            this.renderer.setStyle(newDiv, 'font-size', '14px');
            this.renderer.setAttribute(newDiv, 'id', 'eth-wayback-hint');
            const text = this.renderer.createText(labelText);
            this.renderer.appendChild(newDiv, text);
            this.renderer.insertBefore(btn.parentNode, newDiv, btn.nextSibling);
          }),
          takeUntilDestroyed(this.destroyRef)
        ).subscribe();                    
      }
    });
    const el = this.document.querySelector('nde-full-display-container') as HTMLElement;
    observer.observe(el, { childList: true, subtree: true });
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

}