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
      if (links.length) {
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

    // OOTB Quicklinks exist → do nothing
    if (viewModel?.onlineLinks?.length) {
      console.error("viewModel?.onlineLinks",viewModel?.onlineLinks)
      return [];
    }

    const links: OnlineButtonVM[] = [];

    // take only first serviceUrl
    const electronicService = deliveryEntity?.delivery?.electronicServices?.[0];
    if (electronicService?.serviceUrl) {
      // external data + /view/action/uresolver.do z.B. e-maps
      console.error("electronicService?.serviceUrl",electronicService?.serviceUrl)
      links.push({
        url: electronicService.serviceUrl,
        source: 'electronicServices'
      });
    } else {
      // additional direct link from CDI 
      // https://knowledge.exlibrisgroup.com/Primo/Content_Corner/Central_Discovery_Index/Documentation_and_Training/Documentation_and_Training_(English)/CDI_-_The_Central_Discovery_Index/050CDI_and_Linking_to_Electronic_Full_Text 
      const raw = record?.pnx?.links?.linktorsrcadditional?.[0];
      if (raw) {
        console.error("record?.pnx?.links?.linktorsrcadditional",record?.pnx?.links?.linktorsrcadditional)
        links.push({
          url: this.extractPnxUrl(raw),
          source: 'pnx'
        });
      }
    }

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

  private extractPnxUrl(raw: string): string {
    return raw.replace('$$U', '').split('$$')[0];
  }


  private makePrimoUrl(docId: string): string {
    const tree = this.router.parseUrl(this.router.url);

    const params = new URLSearchParams({
      ...tree.queryParams,
      docid: docId,
      state: '#nui.getit.service_viewit'
    });

    return `/fulldisplay?${params.toString()}`;
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