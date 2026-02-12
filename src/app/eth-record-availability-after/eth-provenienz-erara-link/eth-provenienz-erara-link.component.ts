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
import { catchError, defer, Observable, of, switchMap } from 'rxjs';
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

  readonly links$: Observable<ProvenanceEraraLinksVM> = defer(() =>
    this.ethStoreService.getFullDisplayRecord$().pipe(
      switchMap(record => this.getLinks(record)),
      catchError(error => {
        this.ethErrorHandlingService.logError(error, 'EthProvenienzEraraLinkComponent.linksStream');
        return of({ erara: null, swisscovery: null });
      })
    )
  );

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService,
    private translate: TranslateService,
    private ethStoreService:EthStoreService    
  ) {}

  // provenience cards: 99117339955005503
  // e-rara links: 99120725885805503

  private getLinks(record: PnxDoc | null): Observable<ProvenanceEraraLinksVM> {
    try {
      const display = record?.pnx?.display;
      if (!display?.source?.[0] || display?.source[0] !== 'eth_epics_provenienz') {
        return of({ erara: null, swisscovery: null });
      }

      const lds09 = display.lds09;
      if (!Array.isArray(lds09) || lds09.length === 0) {
        return of({ erara: null, swisscovery: null });
      }

      const eraraLink = this.findEraraLink(lds09);
      const swisscoveryUrl = eraraLink ? this.makeSwisscoveryUrl(eraraLink) : null;

      return of({
        erara: eraraLink ?? null,
        swisscovery: swisscoveryUrl
      });
    } catch(error: unknown){
        this.ethErrorHandlingService.logSyncError(error, 'EthProvenienzEraraLinkComponent.getLinks');  
        return of({ erara: null, swisscovery: null });
    }
  }

  private findEraraLink(lds09: string[]): string | null {
    return lds09.find(link => link.includes('doi.org/10.3931/e-rara-')) ?? null;
  }

  private makeSwisscoveryUrl(eraraLink: string): string | null {
    const swisscoveryQuery = eraraLink.split('dx.doi.org/')[1] ?? null;
    if (!swisscoveryQuery) return null;

    const tab = this.ethStoreService.getTab() || '';
    const scope = this.ethStoreService.getScope() || '';
    const vid = this.ethStoreService.getVid() || '';
    return `/search?query=${swisscoveryQuery}&vid=${vid}&tab=${tab}&search_scope=${scope}`;
  }

  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }    

}
