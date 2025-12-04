import { Component, ElementRef, Inject, inject, Input } from '@angular/core';
import { Observable, catchError, combineLatest, map, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu'
import { MatButtonModule } from '@angular/material/button';
import { TranslateService } from "@ngx-translate/core";
import { SHELL_ROUTER } from "../injection-tokens";
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';


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
  links$!: Observable<any>;
  private router = inject(SHELL_ROUTER);
  @Input() hostComponent: any = {};
  private observer?: MutationObserver;  
  
  constructor(
    private translate: TranslateService,
    private ethStoreService:EthStoreService,     
    private ethErrorHandlingService: EthErrorHandlingService,
    private elementRef: ElementRef,
    @Inject(DOCUMENT) private document: Document       
  ){
    this.elementRef = elementRef;
  }

  ngAfterViewInit() {
    this.links$ = combineLatest<{
        record: any;
        viewModel: any;
        deliveryEntity: any;
      }>({
        record: this.ethStoreService.getRecord$(this.hostComponent),
        viewModel: this.hostComponent.viewModel$,
        deliveryEntity: this.ethStoreService.getDeliveryEntity$(this.hostComponent)
    }).pipe(
      map(({ record, viewModel, deliveryEntity}) => {
        const vM = viewModel as any;
        const dE = deliveryEntity as any;
        const rec = record as any;
        const links: any[] = [];

        // electronic services from delivery; only one
        /*console.error(rec?.pnx?.display?.title)
        console.error("linktorsrcadditional",rec?.pnx?.links?.linktorsrcadditional)
        console.error("delivery",dE.delivery)
        console.error("vM",vM.onlineLinks)*/

        // only do something, if there are no onlineLinks in viewModel$? Otherwise OTB Quicklinks button is rendered
        if (vM?.onlineLinks?.length > 0 ) {
          return [];
        }
        
        // check electronicServices
        if (dE?.delivery?.electronicServices?.length) {
          const link = dE.delivery.electronicServices[0];
          links.push({
            url: link.serviceUrl,
            source: "electronicServices",
            label: "View Online",
            ariaLabel: "View Online" + this.translate.instant('nui.aria.newWindow')
          });
        }

        // ['$$Uhttps://doaj.org/article/4193cf0310734b77be8ab752a0dbc0ba$$EView_record_in_Directory_of_Open_Access_Journals$$FView_record_in_$$GDirectory_of_Open_Access_Journals$$Hfree_for_read']
        // check linktorsrcadditional
        else if (rec?.pnx?.links?.linktorsrcadditional?.length) {
          let link = rec?.pnx?.links?.linktorsrcadditional[0];
          link = link.replace('$$U','');
          link = link.substring(0,link.indexOf('$$'));
          links.push({
            url: link,
            source: "pnx",
            label: "View Online (PNX Link)",
            ariaLabel: "View Online" + this.translate.instant('nui.aria.newWindow')
          });
        }

        else{
          return [];
        }

        // add fulldisplay viewit link
        let labelViewIt = this.translate.instant('nde.delivery.code.otherOnlineOptions');
        if (labelViewIt === 'nde.delivery.code.otherOnlineOptions')labelViewIt = "Available Online";
        links.push({
          url: this.makePrimoUrl(this.getDocId(record)),
          source: "ViewIt",
          label: labelViewIt,
          ariaLabel: labelViewIt
        });

        return links;

      }),

      // remove OTB online button
      tap((links)=>{
        if(links?.length > 0){
          const hostElem = this.elementRef.nativeElement;
          // todo
          this.removeOTBOnlineButton(hostElem);
          //this.checkLibkeyButton(hostElem);
        }
      }),
      catchError(error => {
        this.ethErrorHandlingService.handleSynchronError(error, 'EthOnlineButtonComponent.ngAfterViewInit');
        return [];
      })
    );

  }    

  private getDocId(record: any): string {
    return record?.pnx?.control?.recordid?.[0] || '';
  }  

  private makePrimoUrl(mmsid: string): string {
    const qs = new URLSearchParams(this.updateQueryParams({
      docid: mmsid
    })).toString();
    return `/fulldisplay?${qs}&state=#nui.getit.service_viewit`;
  }  

  updateQueryParams(updates: Record<string, any>) {
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
            hostElement.style.display = "none";
          }
        });
        mo.observe(onlineAvailabilityContainer, { childList: true, subtree: true });
      }
    }
  };

}
