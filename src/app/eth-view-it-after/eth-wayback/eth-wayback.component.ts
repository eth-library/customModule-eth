/* 
For HSA web archive
Example: 99117429500405503

The existing link text will be changed from ‘Link to Online Resource’ to ‘Link to the web archive’ 
An additional note is inserted below: 'In the web archive, select a year and a date marked in blue to access the archived website.' 
*/
// https://jira.ethz.ch/browse/SLSP-2014

import { Component, DestroyRef, inject, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { catchError, distinctUntilChanged, map, of, take, tap } from 'rxjs';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from "@ngx-translate/core";
import { StoreDeliveryEntity } from '../../models/eth.model';

const WAYBACK_URL_SNIPPET = 'https://wayback.archive-It.org';
const WAYBACK_HINT_ID = 'eth-wayback-hint';
const WAYBACK_HINT_CLASS = 'eth-wayback';


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

  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private hasWayback = false;
  private observer: MutationObserver | null = null;
  private ethStoreService = inject(EthStoreService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private renderer = inject(Renderer2);
  private translate = inject(TranslateService);

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnectObserver());
  }


  // 99117429500405503
  ngAfterViewInit() {
    this.observeWaybackLinks();
    this.observeLanguageChanges();
  }

  private observeWaybackLinks(): void {
    this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
      map(deliveryEntity => this.hasWaybackLink(deliveryEntity)),
      distinctUntilChanged(),
      tap(hasWaybackLink => {
        this.hasWayback = hasWaybackLink;
        if (hasWaybackLink) {
          this.initObserver();
        } else {
          this.disconnectObserver();
          this.removeWaybackHint();
        }
      }),
      takeUntilDestroyed(this.destroyRef),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthWaybackComponent.observeWaybackLinks');
        return of(false);
      })
    ).subscribe();
  }

  private observeLanguageChanges(): void {
    this.translate.onLangChange.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (!this.hasWayback) return;
      this.changeDom(true);
    });
  } 

  private hasWaybackLink(deliveryEntity: StoreDeliveryEntity | null): boolean {
    console.error("11111", deliveryEntity?.delivery?.link)
    return deliveryEntity?.delivery?.link?.some(entry =>
      entry.linkURL?.includes(WAYBACK_URL_SNIPPET)
    ) ?? false;
  }

  private initObserver() {
    if (this.observer) return;
    const fullDisplayContainer = this.document.querySelector('nde-full-display-container');
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

  private removeWaybackHint(): void {
    const waybackHint = this.document.querySelector(`#${WAYBACK_HINT_ID}`);
    if (waybackHint) {
      this.renderer.removeChild(waybackHint.parentNode, waybackHint);
    }
  }

  private changeDom(forceUpdate = false) {
    const viewitTextContainer = this.document.querySelector('nde-view-it-card .view-it-text');
    const link = viewitTextContainer?.querySelector('a');
    const linkTextSpan = viewitTextContainer?.querySelector('a span');
    const parent = viewitTextContainer?.parentNode as HTMLElement | null;
    if (!viewitTextContainer || !linkTextSpan || !parent) return;
    const existing = parent.querySelector(`#${WAYBACK_HINT_ID}`) as HTMLElement | null;
    if (
      !forceUpdate &&
      existing &&
      linkTextSpan.textContent === this.translate.instant('eth.wayback.linkText') &&
      existing.textContent === this.translate.instant('eth.wayback.text')
    ) {
      return;
    }    

    this.translate.get([
      'eth.wayback.text',
      'eth.wayback.linkText',
      'nui.aria.newWindow'
    ])
    .pipe(
      take(1)
    )
    .subscribe(t => {
      const labelText = t['eth.wayback.text'];
      const labelLinkText = t['eth.wayback.linkText'];
      const newWindow = t['nui.aria.newWindow'];

      this.renderer.setProperty(linkTextSpan, 'textContent', labelLinkText);
      this.renderer.setAttribute(link, 'aria-label', `${labelLinkText}${newWindow}`);

      let hintDiv = parent.querySelector(`#${WAYBACK_HINT_ID}`) as HTMLElement | null;

      if (!hintDiv) {
        hintDiv = this.renderer.createElement('div');
        this.renderer.addClass(hintDiv, WAYBACK_HINT_CLASS);
        this.renderer.setAttribute(hintDiv, 'id', WAYBACK_HINT_ID);
        this.renderer.insertBefore(parent, hintDiv, viewitTextContainer.nextSibling);
      }
      const safeHintDiv = hintDiv as HTMLElement;
      safeHintDiv.textContent = labelText;

    });
  }
  
}