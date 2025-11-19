import { Component, Inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { catchError, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


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
   
  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document    
  ){}

  ngAfterViewInit() {
    // 99117429500405503
    this.ethStoreService.getDeliveryEntity$().pipe(
      //tap(deliveryEntity => {console.error("deliveryEntity",deliveryEntity)}),
      map(deliveryEntity => {
        return deliveryEntity?.delivery?.link?.some(
          (e:any) => {return e.linkURL?.includes('https://wayback.archive-It.org')}
        ) ?? false;
      }),
      filter(hasWaybackUrl => hasWaybackUrl),
      take(1),
      tap(() => this.changeDOM()),
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthWaybackComponent');
        return of(false);
      })      
    )
    //.pipe(takeUntilDestroyed()) todo
    .subscribe();
  }

  changeDOM() {
    const observer = new MutationObserver(() => {
      const btnH5 = this.document.querySelector('nde-view-it-card button h5');
      if (btnH5) {
        observer.disconnect();
        this.renderer.setProperty(btnH5, 'textContent', 'Link to the web archive');
        const btn = this.document.querySelector('nde-view-it-card button');
        if (btn && btn.parentNode) {
          const newDiv = this.renderer.createElement('div');
          this.renderer.setStyle(newDiv, 'padding-left', '6px');
          this.renderer.setStyle(newDiv, 'font-size', '14px');
          const text = this.renderer.createText('In the web archive, select a year and a date marked in blue to access the archived website.');
          this.renderer.appendChild(newDiv, text);
          this.renderer.insertBefore(btn.parentNode, newDiv, btn.nextSibling);
        }
      }
    });
    observer.observe(this.document.body, { childList: true, subtree: true });
  }
}