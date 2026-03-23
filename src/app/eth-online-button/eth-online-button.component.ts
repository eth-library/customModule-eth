/*

https://jira.ethz.ch/browse/SLSP-2354
Creates a button for direct online access if
- no OOTB quick link is available (= no viewModel.onlineLinks).
- not Alma-D (99120192274305503)
- not Library Stack (cdi_librarystack_primary_159090)

The button is based on:
- deliveryEntity.delivery.electronicServices:  external data + link resolver (uresolver.do)
- record.pnx.links.linktorsrcadditional: additional direct link from CDI (https://knowledge.exlibrisgroup.com/Primo/Content_Corner/Central_Discovery_Index/Documentation_and_Training/Documentation_and_Training_(English)/CDI_-_The_Central_Discovery_Index/050CDI_and_Linking_to_Electronic_Full_Text)

Sometimes online button only appears in the full view (not result list).
Example: cdi_oup_oro_10_1093_acref_9780199674985_013_0355
Why?
The deliveryEntity.delivery.electronicServices field is not available in the result list, but in the full view.
Instead, the result list contains the following in the delivery object:
almaOpenurl:https://eu03.alma.exlibrisgroup.com/view/uresolver/41SLSP_ETH/openurl?ctx_enc=info ...
In full view, electronicServices is available, but not almaOpenurl.
Typical case for almaOpenurl:
Alma has a portfolio for the book, not for the chapter, so Primo cannot map directly to chapters.
Or missing: ISBN, ISSN, DOI.

Distinction between uresolver.do (online button also in result list) and uresolver:
If Primo already knows exactly which electronic portfolio matches during indexing or hit matching,
you get the following directly: /view/action/uresolver.do?operation=resolveService&package_service_id=12345
This typically happens when:
* the hit originates from Alma itself
* from the Alma Knowledge Base (Electronic Collection)
* the match is unambiguous via ISSN + coverage + volume

If Primo cannot determine a unique service, an OpenURL is generated instead: /view/uresolver/41SLSP_ETH/openurl?...
This is then evaluated by the resolver in Alma.
This typically occurs with:
* externally indexed articles (Crossref, Scopus, etc.)
* hits without a unique ISSN
* multiple possible services
* unclear coverage
* records without an Alma portfolio
The resolver then decides which services are suitable when the full view is called.

*/

import { Component,
  DestroyRef,
  ElementRef,
  inject,
  Inject,
  Input
} from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  ReplaySubject,
  combineLatest,
  map,
  distinctUntilChanged,
  tap,
  of,
  switchMap,
  catchError
} from 'rxjs';

import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import {
  PnxDoc,
  StoreDeliveryEntity,
  HostComponentViewModel,
  HostComponent,
  OnlineButtonVM
} from '../models/eth.model';
import { SHELL_ROUTER } from '../injection-tokens';

@Component({
  selector: 'custom-eth-online-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    SafeTranslatePipe
  ],
  templateUrl: './eth-online-button.component.html',
  styleUrls: ['./eth-online-button.component.scss']
})
export class EthOnlineButtonComponent  {

  private hostComponent$ = new ReplaySubject<HostComponent>(1);
  private mutationObserver?: MutationObserver;
  private destroyRef = inject(DestroyRef);

  @Input() set hostComponent(value: HostComponent) {
    if (value) {
      this.hostComponent$.next(value);
    }
  }

  links$: Observable<OnlineButtonVM[]> = this.hostComponent$.pipe(
    switchMap(host =>
      combineLatest({
        record: this.ethStoreService.getRecord$(host),
        viewModel: host.viewModel$ ?? of(null),
        deliveryEntity: this.ethStoreService.getDeliveryEntity$(host)
      })
    ),
    map(({ record, viewModel, deliveryEntity }) =>
      this.buildButtonIfNecessary(record, viewModel, deliveryEntity)
    ),
    distinctUntilChanged((a, b) =>
      a.length === b.length &&
      a.every((v, i) => v.url === b[i]?.url && v.source === b[i]?.source)
    ),
    tap(links => {
      if (links.length > 1) {
        this.hideOOTBQuicklink();
        //this.observeLibkeyAppearance();
      }
    }),
    catchError(err => {
      this.ethErrorHandlingService.logSyncError(
        err,
        'EthOnlineButtonComponent.links$'
      );
      return of([]);
    })
  );

  constructor(
    @Inject(SHELL_ROUTER) private router: Router,
    private ethStoreService: EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private elementRef: ElementRef<HTMLElement>
  ) {
    //this.destroyRef.onDestroy(() => this.disconnectLibkeyObserver());
  }


  private buildButtonIfNecessary(
    record: PnxDoc,
    viewModel: HostComponentViewModel | null,
    deliveryEntity: StoreDeliveryEntity
  ): OnlineButtonVM[] {

    /*console.error("start")
    console.error("viewModel",viewModel?.onlineLinks)
    console.error("almaOpenurl",deliveryEntity?.delivery?.almaOpenurl)
    console.error("delivery",deliveryEntity)
    console.error("electronicServices",deliveryEntity?.delivery?.electronicServices?.[0].serviceUrl)
    console.error("linktorsrcadditional",record?.pnx?.links?.linktorsrcadditional)*/

    // OOTB Quicklinks exists → do nothing
    if (viewModel?.onlineLinks?.length) {
      return [];
    }

    // Alma-D → do nothing: 99120192274305503
    if(deliveryEntity?.delivery?.deliveryCategory?.[0] === "Alma-D"){
      return [];
    }

    // Libray Stack → do nothing: cdi_librarystack_primary_159090
    if (this.hasLibraryStackLink(deliveryEntity)){
      return [];
    }

    const links: OnlineButtonVM[] = [];

    // take only first serviceUrl (we show only one)
    const electronicService = deliveryEntity?.delivery?.electronicServices?.[0];
    if (electronicService?.serviceUrl) {
      // external data + /view/action/uresolver.do?operation=resolveService&package_service_id=17890018850005503&institutionId=5503&customerId=5500&VE=true z.B. e-maps
      links.push({
        url: electronicService.serviceUrl,
        source: 'electronicServices'
      });
    } else {
      // additional direct link from CDI 
      // https://knowledge.exlibrisgroup.com/Primo/Content_Corner/Central_Discovery_Index/Documentation_and_Training/Documentation_and_Training_(English)/CDI_-_The_Central_Discovery_Index/050CDI_and_Linking_to_Electronic_Full_Text 
      const raw = record?.pnx?.links?.linktorsrcadditional?.[0];
      if (raw) {
        links.push({
          url: this.extractDollarUrl(raw),
          source: 'pnx'
        });
      }
    }
    /* if the online button is only in fullview, we see in resultList:
    almaOpenurl: https://eu03.alma.exlibrisgroup.com/view/uresolver/41SLSP_ETH/openurl?ctx_enc=info:ofi/enc:UTF-8&ctx_id=10_1&ctx_tim=2026-03-10 07:00:29&ctx_ver=Z39.88-2004&url_ctx_fmt=info:ofi/fmt:kev:mtx:ctx&url_ver=Z39.88-2004&rfr_id=info:sid/primo.exlibrisgroup.com-crossref&rft_val_fmt=info:ofi/fmt:kev:mtx:journal&rft.genre=article&rft.atitle=La+cin%C3%A9aste+d%E2%80%99Hitler%2C+un+monstre+d%E2%80%99%C3%A9go%C3%AFsme+et+de+racisme%3A+%C3%80+propos+du+film+Leni+Riefenstahl%2C+la+lumi%C3%A8re+et+les+ombres%2C+film+documentaire+d%E2%80%99Andres+Veiel%2C+2024&rft.jtitle=Cahiers+d%27histoire+%28Espaces+Marx+%28Association%29%29&rft.au=Maurel%2C+Chlo%C3%A9&rft.date=2025&rft.volume=163&rft.spage=205&rft.epage=208&rft.pages=205-208&rft.issn=1271-6669&rft.eissn=2102-5916&rft_id=info:doi/10.4000%2F14jxy&rft_dat=<crossref>10_4000_14jxy</crossref>&svc_dat=viewit
    */
    
    // link fullview, online section
    // in template check: links.length > 1
    const docId = record?.pnx?.control?.recordid?.[0];
    if (docId) {
      links.push({
        url: this.makePrimoUrl(docId),
        source: 'ViewIt'
      });
    }
    return links;
  }

  private extractDollarUrl(raw: string): string {
    return raw.replace('$$U', '').split('$$')[0];
  }


  private makePrimoUrl(docId: string): string {
    const tree = this.router.parseUrl(this.router.url);
    const params = new URLSearchParams({
      ...tree.queryParams,
      docid: docId
    });

    return `/fulldisplay?${params.toString()}&state=#nui.getit.service_viewit`;
  }

  
  navigate(source: string, url: string, event: Event): void {
    if (source === 'ViewIt') {
      event.preventDefault();
      this.router.navigateByUrl(url);
    } else {
      globalThis.open?.(url, '_blank', 'noopener,noreferrer');
    }
  }


  private hasLibraryStackLink(deliveryEntity: StoreDeliveryEntity | null): boolean {
    return deliveryEntity?.delivery?.link?.some(entry =>
      entry.linkURL?.includes('www.librarystack.org')
    ) ?? false;
  }

  
  // DOM Handling
  private getOnlineAvailabilityContainer(): HTMLElement | null {
    return this.elementRef.nativeElement.closest('nde-record-availability') as HTMLElement | null;
  }

  private hideOOTBQuicklink(): void {
    const container = this.getOnlineAvailabilityContainer();
    if (!container) return;

    const otb = container.querySelector('nde-online-availability');
    this.setElementDisplay(otb, 'none');
  }

  private setElementDisplay(element: Element | null, display: string): void {
    if (element instanceof HTMLElement) {
      element.style.display = display;
    }
  }

  private disconnectLibkeyObserver(): void {
    this.mutationObserver?.disconnect();
    this.mutationObserver = undefined;
  }

  private observeLibkeyAppearance(): void {
    const container = this.getOnlineAvailabilityContainer();
    if (!container) return;

    if (this.mutationObserver) return;

    this.mutationObserver = new MutationObserver((_m, obs) => {
      const libkey = container.querySelector('.ti-stack-options-container');

      if (libkey) {
        obs.disconnect();
        this.mutationObserver = undefined;

        const ethButton = container.querySelector('.eth-quicklink-container');
        this.setElementDisplay(ethButton, 'none');
      }
    });

    this.mutationObserver.observe(container, {
      childList: true,
      subtree: true
    });
  }
}