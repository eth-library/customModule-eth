/*
Links between e-rara prints and E-Pics images in both directions:
1. Image -> Print: E-Pics also contains images of provenance features of old prints from the ETH Library.
These images are linked to:
- Print in e-rara
- Print and all its provenances in swisscovery
2. Print -> Image:
The provenance images are displayed in the detailed view of the respective print.
*/
// https://jira.ethz.ch/browse/SLSP-2006
// \eth-full-display-side-bar-after\eth-provenienz\eth-provenienz.component.ts

import { Component, Input, inject } from '@angular/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from '../../services/eth-store.service';
import { CommonModule } from '@angular/common';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { TranslateService } from "@ngx-translate/core";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { SHELL_ROUTER } from "../../injection-tokens";
import { HostComponent, PnxDoc, ProvenanceEraraLinksVM } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-provenienz-erara-link',
  templateUrl: './eth-provenienz-erara-link.component.html',
  styleUrls: ['./eth-provenienz-erara-link.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]   
})
export class EthProvenienzEraraLinkComponent {
  @Input() hostComponent: HostComponent = {};
  private router = inject(SHELL_ROUTER);   
    
  links$!: Observable<ProvenanceEraraLinksVM>;

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService,
    private translate: TranslateService,
    private ethStoreService:EthStoreService    
  ) {}

  // provenience cards: 99117339955005503
  // e-rara links: 99120725885805503
  ngAfterViewInit() {
    this.links$ = this.ethStoreService.getFullDisplayRecord$().pipe(
      switchMap(record => this.getLinks(record)),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthProvenienzEraraLinkComponent.ngAfterViewInit');
        return of({erara:null, swisscovery:null});
      })  
    );
  }


  private getLinks(record: PnxDoc | null): Observable<ProvenanceEraraLinksVM> {
    try {
      const display = record?.pnx?.display;
      if (!display?.source?.[0] || display?.source[0] !== 'eth_epics_provenienz') return of({erara:null, swisscovery:null});

      const lds09 = display.lds09;
      if (!Array.isArray(lds09) || lds09.length === 0) return of({erara:null, swisscovery:null});
      let eraraLink = lds09.find((l: string) => l.includes('doi.org/10.3931/e-rara-'));
      let swisscoveryUrl = null;
      if (eraraLink) {
        const swisscoveryQuery = eraraLink.split('dx.doi.org/')[1] ?? null;
        const tab = this.ethStoreService.getTab() || '';
        const scope = this.ethStoreService.getScope() || '';
        const vid = this.ethStoreService.getVid() || '';
        swisscoveryUrl = `/search?query=${swisscoveryQuery}&vid=${vid}&tab=${tab}&search_scope=${scope}`;
      }
      return of({
        erara: eraraLink ?? null,
        swisscovery: swisscoveryUrl
      })
    } catch(error: unknown){
        this.ethErrorHandlingService.logSyncError(error, 'EthProvenienzEraraLinkComponent.getLinks');  
        return of({erara:null, swisscovery:null});
    }
  }

  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }    

}


/**
             eth.provenienzEraraLink.erara:{
                de: 'Quelle in e-rara',
                en: 'Source in e-rara'
            },
            eth.provenienzEraraLink.swisscovery: {
                de: 'Details Provenienzvermerk',
                en: 'Details provenance mark'
            }
 
 */