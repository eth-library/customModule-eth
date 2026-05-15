/* 
  Librarystack
  - change link text of resource link
  - add hint about usage of library stack (Password-protected access. Restricted to members of ETH Zurich only...)
*/
// https://jira.ethz.ch/browse/SLSP-1999

import { Component, Renderer2, DestroyRef, inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { catchError, distinctUntilChanged, map, of, take, tap } from 'rxjs';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StoreDeliveryEntity } from '../../models/eth.model';

const LIBRARYSTACK_URL_SNIPPET = 'www.librarystack.org';
const FULL_DISPLAY_SELECTOR = 'nde-full-display-container';
const VIEW_IT_BUTTON_SELECTOR = 'nde-view-it-card button';
const TEXT1_CLASS = 'eth-librarystack-text1';
const TEXT2_CLASS = 'eth-librarystack-text2';


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

  private destroyRef = inject(DestroyRef);
  private hasLibraryStack = false;
  private observer: MutationObserver | null = null;
  private document = inject(DOCUMENT);

  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private renderer: Renderer2,
    private translate: TranslateService
  ){
    this.destroyRef.onDestroy(() => this.disconnectObserver());
  }

  // cdi_librarystack_primary_159090
  ngAfterViewInit() {
    this.observeLibraryStackLinks();
    this.observeLanguageChanges();
  }

  private observeLibraryStackLinks(): void {
    this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
      map(deliveryEntity => this.hasLibraryStackLink(deliveryEntity)),
      distinctUntilChanged(),
      tap(hasLibraryStackLink => {
        this.hasLibraryStack = hasLibraryStackLink;
        if (hasLibraryStackLink) {
          this.initObserver();
        } else {
          this.disconnectObserver();
          this.removeHints();
        }
      }),
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthLibraryStackComponent.ngAfterViewInit');
        return of(false);
      })
    ).subscribe();
  }

  private observeLanguageChanges(): void {
    this.translate.onLangChange.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (!this.hasLibraryStack) return;
      this.changeDom(true);
    });
  }

  private hasLibraryStackLink(deliveryEntity: StoreDeliveryEntity | null): boolean {
    return deliveryEntity?.delivery?.link?.some(entry =>
      entry.linkURL?.includes(LIBRARYSTACK_URL_SNIPPET)
    ) ?? false;
  }

  initObserver() {
    if (this.observer) return;

    const fullDisplayContainer = this.document.querySelector(FULL_DISPLAY_SELECTOR);
    if (!fullDisplayContainer) return;

    this.observer = new MutationObserver(() => this.changeDom());
    this.observer.observe(fullDisplayContainer, { childList: true, subtree: true }); 

    // initial
    this.changeDom(); 
  }

  private disconnectObserver(): void {
    this.observer?.disconnect();
    this.observer = null;
  }


  private removeHints(): void {
    const text1Elements = this.document.querySelectorAll(`.${TEXT1_CLASS}`);
    const text2Elements = this.document.querySelectorAll(`.${TEXT2_CLASS}`);

    text1Elements.forEach(element => this.renderer.removeChild(element.parentNode, element));
    text2Elements.forEach(element => this.renderer.removeChild(element.parentNode, element));
  }


  private changeDom(forceUpdate = false) {
    const btn = this.document.querySelector(VIEW_IT_BUTTON_SELECTOR);
    if (!btn || !btn.parentNode) return;

    const parent = btn.parentNode as HTMLElement;
    const existingText1 = parent.querySelector(`.${TEXT1_CLASS}`);
    const existingText2 = parent.querySelector(`.${TEXT2_CLASS}`);

    if (forceUpdate) {
      if (existingText1) this.renderer.removeChild(parent, existingText1);
      if (existingText2) this.renderer.removeChild(parent, existingText2);
    }

    // guard (multiple render + prevent loop dom changes)
    if (!forceUpdate && existingText1) return;

    this.translate.get([
      'eth.libraryStack.text1',
      'eth.libraryStack.text2'
    ])
    .pipe(
      take(1)
    ).subscribe(t => {
      const div1 = this.renderer.createElement('div');
      this.renderer.addClass(div1, TEXT1_CLASS);
      this.renderer.appendChild(div1, this.renderer.createText(t['eth.libraryStack.text1']));

      const div2 = this.renderer.createElement('div');
      this.renderer.addClass(div2, TEXT2_CLASS);
      this.renderer.appendChild(div2, this.renderer.createText(t['eth.libraryStack.text2']));

      this.renderer.appendChild(parent, div1);
      this.renderer.appendChild(parent, div2);
    });
  }
  
}