/* Quicklinks/online buttons to online resources, similar to OTB Quicklinks

  viewModel$.onlineLinks -> ORB Quicklinks are rendered -> do nothing
  deliveryEntity.delivery.electronicServices or record.pnx.links.linktorsrcadditional exists -> direct link to resource
  add link to fullview viewit section in dropdown 
  remove OTB online button
*/
// https://jira.ethz.ch/browse/SLSP-2354

import { Component, ElementRef, Inject, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, combineLatest, map, of, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button';
import { SHELL_ROUTER } from "../injection-tokens";
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import { PnxDoc, StoreDeliveryEntity, HostComponentViewModel, HostComponent, OnlineButtonLinkVM } from '../models/eth.model';

@Component({
  selector: 'custom-eth-online-button',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatSelectModule,    
    MatIconModule,
    MatMenuModule,
    SafeTranslatePipe
  ],
  templateUrl: './eth-online-button.component.html',
  styleUrls: ['./eth-online-button.component.scss']
})
export class EthOnlineButtonComponent {
  links$: Observable<OnlineButtonLinkVM[]> = of([]);
  @Input() hostComponent: HostComponent = {};
    
  constructor(
    @Inject(SHELL_ROUTER) private router: Router,
    private ethStoreService:EthStoreService,     
    private ethErrorHandlingService: EthErrorHandlingService,
    private elementRef: ElementRef
  ){}


  ngAfterViewInit() {
    const source$ = combineLatest({
      record: this.ethStoreService.getRecord$(this.hostComponent),
      viewModel: this.hostComponent.viewModel$ ?? of(null),
      deliveryEntity: this.ethStoreService.getDeliveryEntity$(this.hostComponent)
    }) as Observable<{
      record: PnxDoc;
      viewModel: HostComponentViewModel | null;
      deliveryEntity: StoreDeliveryEntity;
    }>;

    this.links$ = source$.pipe(
      map(({ record, viewModel, deliveryEntity }) => {
        const links: { url: string; source: string }[] = [];
        // only do something, if there are no onlineLinks in viewModel$. Otherwise OTB Quicklinks button is rendered.
        if (viewModel?.onlineLinks?.length) {
          return [];
        }
        // check electronicServices
        const es = deliveryEntity?.delivery?.electronicServices?.[0];
        if (es) {
          links.push({
            url: es.serviceUrl,
            source: 'electronicServices'
          });
        } 
        // check linktorsrcadditional
        else if(record?.pnx?.links?.linktorsrcadditional?.[0]) {
          const raw = record?.pnx?.links?.linktorsrcadditional?.[0];
          links.push({
            url: raw.replace('$$U', '').split('$$')[0],
            source: 'pnx'
          });
        }
        // add fulldisplay viewit link
        const docId = this.getDocId(record);
        if (docId) {
          links.push({
            url: this.makePrimoUrl(docId),
            source: 'ViewIt'
          });
        }

        return links;

      }),
      tap(links => {
        // remove OTB online button
        if (links.length) {
          const hostElem = this.elementRef.nativeElement;
          this.removeOTBOnlineButton(hostElem);
          this.checkLibkeyButton(hostElem);          
        }
       
      }),
      catchError(err => {
        this.ethErrorHandlingService.logSyncError( err, 'EthOnlineButtonComponent.ngAfterViewInit()');
        return of([]);
      })
    );
  }    

  private getDocId(record: PnxDoc): string {
    return record?.pnx?.control?.recordid?.[0] || '';
  }  

  private makePrimoUrl(mmsid: string): string {
    const qs = new URLSearchParams(this.updateQueryParams({
      docid: mmsid
    })).toString();
    return `/fulldisplay?${qs}&state=#nui.getit.service_viewit`;
  }  

  updateQueryParams(updates: Record<string, string>) {
    const tree = this.router.parseUrl(this.router.url);
    const current = { ...tree.queryParams };
    // merge changed values
    const merged = { ...current, ...updates };
    return merged;
  }

  navigate(source:string, url: string, event: Event){
    if(source === 'ViewIt'){
      event.preventDefault(); 
      this.router.navigateByUrl(url);
    }
    else{
      window.open(url)
    }
  }

  removeOTBOnlineButton(hostElement: HTMLElement){
    if (hostElement?.parentElement?.parentElement) {
      const onlineAvailabilityContainer: HTMLElement = hostElement.parentElement.parentElement;
      if (onlineAvailabilityContainer) {
        const onlineAvailabilityElement = onlineAvailabilityContainer.getElementsByTagName('nde-online-availability') as HTMLCollectionOf<HTMLElement>;
        const onlineAvailabilityElementArray = Array.from(onlineAvailabilityElement);
        if(onlineAvailabilityElementArray?.length > 0){
          onlineAvailabilityElementArray[0].style.display = 'none';
        }
      }
    }
  };  
  
  // cdi_crossref_primary_10_1525_abt_2019_81_7_525
  // http://localhost:4201/nde/fulldisplay?query=genetics&tab=41SLSP_DN_CI&search_scope=DN_and_CI&pfilter=rtype,exact,articles&searchInFulltext=true&facet=tlevel,include,online_resources&facet=tlevel,include,peer_reviewed&offset=20&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=de&docid=cdi_crossref_primary_10_1525_abt_2019_81_7_525&adaptor=Primo%20Central&context=PC&isFrbr=true&isHighlightedRecord=false&state=
  // http://localhost:4201/nde/search?query=genetics&tab=41SLSP_DN_CI&search_scope=DN_and_CI&pfilter=rtype,exact,articles&searchInFulltext=true&facet=tlevel,include,online_resources&facet=tlevel,include,peer_reviewed&offset=30&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=de
  checkLibkeyButton(hostElement: HTMLElement){
    if (hostElement?.parentElement?.parentElement) {
      const onlineAvailabilityContainer: HTMLElement = hostElement.parentElement.parentElement;
      if (onlineAvailabilityContainer) {
        const mo = new MutationObserver((_mutations, obs) => {
          const libkeyElement = onlineAvailabilityContainer.querySelectorAll('.ti-stack-options-container');
          const libkeyElementArray = Array.from(libkeyElement);
          if (libkeyElementArray?.length) {
            obs.disconnect();
            //hostElement.style.display = "none";
            // 99118160319605508
            const ethOnlineButton = onlineAvailabilityContainer.querySelector('.eth-quicklink-container') as HTMLElement;
            //ethOnlineButton.style.display = "none";
          }
        });
        mo.observe(onlineAvailabilityContainer, { childList: true, subtree: true });
      }
    }
  };

}
