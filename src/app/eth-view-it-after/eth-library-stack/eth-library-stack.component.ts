/* 
  Librarystack
  change link text of resource link
  add hint about usage of library stack (Password-protected access. Restricted to members of ETH Zurich only...)
*/
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

  // cdi_librarystack_primary_159090
  ngAfterViewInit() {
    this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
      //tap(deliveryEntity => {console.error("deliveryEntity",deliveryEntity)}),
      map(deliveryEntity => {
        return deliveryEntity?.delivery?.link?.some(
          (e:any) => {return e.linkURL?.includes('www.librarystack.org')}
        ) ?? false;
      }),
      filter(hasLibraryStackUrl => hasLibraryStackUrl),
      tap(() => this.initObserver()),
      takeUntilDestroyed(this.destroyRef),  
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthLibraryStackComponent');
        return of(false);
      })      
    )
    .subscribe();

    // change language -> render again
    this.translate.onLangChange.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.changeDom());    

  }


  initObserver() {
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
    if (!btn || !btn.parentNode) return;

    const parent = btn.parentNode as HTMLElement;

    // guard (multiple render + prevent loop dom changes)
    if (parent.querySelector('.eth-librarystack-text1')) return;

    this.translate.get([
      'eth.libraryStack.text1',
      'eth.libraryStack.text2'
    ])
    .pipe(
      take(1)
    ).subscribe(t => {
      const div1 = this.renderer.createElement('div');
      this.renderer.addClass(div1, 'eth-librarystack-text1');
      this.renderer.appendChild(div1, this.renderer.createText(t['eth.libraryStack.text1']));

      const div2 = this.renderer.createElement('div');
      this.renderer.addClass(div2, 'eth-librarystack-text2');
      this.renderer.appendChild(div2, this.renderer.createText(t['eth.libraryStack.text2']));

      this.renderer.appendChild(parent, div1);
      this.renderer.appendChild(parent, div2);
    });
  }
  
}