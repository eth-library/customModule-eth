import { Component, OnInit, Inject, Optional, Input, inject } from '@angular/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from '../../services/eth-store.service';
import { CommonModule } from '@angular/common';
import { catchError, Observable, of, switchMap, tap } from 'rxjs';
import { TranslateService } from "@ngx-translate/core";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { SHELL_ROUTER } from "../../injection-tokens";

type Links = { erara: string | null; swisscovery: string | null};


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
  @Input() hostComponent: any = {};
  private router = inject(SHELL_ROUTER);   
    
  links$!: Observable<Links>;

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
        this.ethErrorHandlingService.handleError(error, 'EthProvenienzEraraLinkComponent.ngAfterViewInit');
        return of({erara:null, swisscovery:null});
      })  
    );
  }


  private getLinks(record: any): Observable<Links> {
    try {
      const display = record?.pnx?.display;
      if (!display?.source?.[0] || display.source[0] !== 'eth_epics_provenienz') return of({erara:null, swisscovery:null});

      const lds09 = display.lds09;
      if (!Array.isArray(lds09) || lds09.length === 0) return of({erara:null, swisscovery:null});
      const eraraLink = lds09.find((l: string) => l.includes('dx.doi.org/10.3931/e-rara-'));
      let swisscoveryUrl = null;
      if (eraraLink) {
        const swisscoveryQuery = eraraLink.split('dx.doi.org/')[1] ?? null;
        const tab = this.ethStoreService.getTab();
        const scope = this.ethStoreService.getScope();
        const vid = this.ethStoreService.getVid();
        swisscoveryUrl = `/search?query=${swisscoveryQuery}&vid=${vid}&tab=${tab}&search_scope=${scope}`;
      }
      return of({
        erara: eraraLink,
        swisscovery: swisscoveryUrl
      })
    } catch(error: any){
        this.ethErrorHandlingService.handleSynchronError(error, 'EthProvenienzEraraLinkComponent.getLinks');  
        return of({erara:null, swisscovery:null});
    }
  }

  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }    

}


