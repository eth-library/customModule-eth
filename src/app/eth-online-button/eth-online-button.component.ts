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
      this.buildLinks(record, viewModel, deliveryEntity)
    ),
    distinctUntilChanged((a, b) =>
      a.length === b.length &&
      a.every((v, i) => v.url === b[i]?.url && v.source === b[i]?.source)
    ),
    tap(links => {
      if (links.length > 1) {
        this.hideOTBOnlineButton();
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
  ) {}


  private buildLinks(
    record: PnxDoc,
    viewModel: HostComponentViewModel | null,
    deliveryEntity: StoreDeliveryEntity
  ): OnlineButtonVM[] {

    // OOTB Quicklinks exists → do nothing
    if (viewModel?.onlineLinks?.length) {
      return [];
    }

    const links: OnlineButtonVM[] = [];

    // take only first serviceUrl (we show only one)
    /*console.error(1111111111)
    console.error("almaOpenurl",deliveryEntity?.delivery?.almaOpenurl)
    console.error("electronicServices",deliveryEntity?.delivery?.electronicServices?.[0].serviceUrl)
    console.error("linktorsrcadditional",record?.pnx?.links?.linktorsrcadditional)*/
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
    /* almaOpenurl: https://eu03.alma.exlibrisgroup.com/view/uresolver/41SLSP_ETH/openurl?ctx_enc=info:ofi/enc:UTF-8&ctx_id=10_1&ctx_tim=2026-03-10 07:00:29&ctx_ver=Z39.88-2004&url_ctx_fmt=info:ofi/fmt:kev:mtx:ctx&url_ver=Z39.88-2004&rfr_id=info:sid/primo.exlibrisgroup.com-crossref&rft_val_fmt=info:ofi/fmt:kev:mtx:journal&rft.genre=article&rft.atitle=La+cin%C3%A9aste+d%E2%80%99Hitler%2C+un+monstre+d%E2%80%99%C3%A9go%C3%AFsme+et+de+racisme%3A+%C3%80+propos+du+film+Leni+Riefenstahl%2C+la+lumi%C3%A8re+et+les+ombres%2C+film+documentaire+d%E2%80%99Andres+Veiel%2C+2024&rft.jtitle=Cahiers+d%27histoire+%28Espaces+Marx+%28Association%29%29&rft.au=Maurel%2C+Chlo%C3%A9&rft.date=2025&rft.volume=163&rft.spage=205&rft.epage=208&rft.pages=205-208&rft.issn=1271-6669&rft.eissn=2102-5916&rft_id=info:doi/10.4000%2F14jxy&rft_dat=<crossref>10_4000_14jxy</crossref>&svc_dat=viewit */
    
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
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }


  // DOM Handling
  private getOnlineAvailabilityContainer(): HTMLElement | null {
    return this.elementRef.nativeElement.closest('nde-record-availability') as HTMLElement | null;
  }

  private hideOTBOnlineButton(): void {
    const container = this.getOnlineAvailabilityContainer();
    if (!container) return;

    const otb = container.querySelector('nde-online-availability');
    if (otb instanceof HTMLElement) {
      otb.style.display = 'none';
    }
  }

  private observeLibkeyAppearance(): void {
    const container = this.getOnlineAvailabilityContainer();
    if (!container) return;

    this.mutationObserver?.disconnect();

    this.mutationObserver = new MutationObserver((_m, obs) => {
      const libkey = container.querySelector('.ti-stack-options-container');

      if (libkey) {
        obs.disconnect();

        const ethButton = container.querySelector('.eth-quicklink-container');

        if (ethButton instanceof HTMLElement) {
          ethButton.style.display = 'none';
        }
      }
    });

    this.mutationObserver.observe(container, {
      childList: true,
      subtree: true
    });

    this.destroyRef.onDestroy(() => this.mutationObserver?.disconnect());
  }
}