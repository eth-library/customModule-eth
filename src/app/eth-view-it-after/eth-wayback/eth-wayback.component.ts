/* 
  HSA web archive
  change link text of resource link
  add hint about usage of web archive
*/
// https://jira.ethz.ch/browse/SLSP-2014

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


  // 99117429500405503
  ngAfterViewInit() {
    this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
      map(deliveryEntity =>
        deliveryEntity?.delivery?.link?.some(
          (e: any) => e.linkURL?.includes('https://wayback.archive-It.org')
        ) ?? false
      ),
      filter(hasWaybackUrl => hasWaybackUrl),
      tap(() => this.initObserver()),
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthWaybackComponent');
        return of(false);
      })
    ).subscribe();

    this.translate.onLangChange.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.changeDom());    

  }

  private initObserver() {
    const fullDisplayContainer = this.document.querySelector('nde-full-display-container');
    if (!fullDisplayContainer) return;

    const observer = new MutationObserver(() => this.changeDom());

    observer.observe(fullDisplayContainer, { childList: true, subtree: true });

    // initial
    this.changeDom();

    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  private changeDom() {
    const btn = this.document.querySelector('nde-view-it-card button');
    const btnH5 = btn?.querySelector('h5');
    const parent = btn?.parentNode as HTMLElement | null;

    if (!btn || !btnH5 || !parent) return;

    const existing = parent.querySelector('#eth-wayback-hint') as HTMLElement | null;
    if (existing && btnH5.textContent === this.translate.instant('eth.wayback.linkText') && existing.textContent === this.translate.instant('eth.wayback.text')) {
      return;
    }    

    this.translate.get([
      'eth.wayback.text',
      'eth.wayback.linkText'
    ])
    .pipe(
      take(1)
    )
    .subscribe(t => {
      const labelText = t['eth.wayback.text'];
      const labelLinkText = t['eth.wayback.linkText'];

      this.renderer.setProperty(btnH5, 'textContent', labelLinkText);
      this.renderer.setAttribute(btnH5, 'aria-label', labelLinkText);

      let hintDiv = parent.querySelector('#eth-wayback-hint') as HTMLElement | null;

      if (!hintDiv) {
        hintDiv = this.renderer.createElement('div');
        this.renderer.addClass(hintDiv, 'eth-wayback');
        this.renderer.setAttribute(hintDiv, 'id', 'eth-wayback-hint');
        this.renderer.insertBefore(parent, hintDiv, btn.nextSibling);
      }
      const safeHintDiv = hintDiv as HTMLElement;
      safeHintDiv.textContent = labelText;

    });
  }
  
}