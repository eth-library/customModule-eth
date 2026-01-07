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
// \eth-record-availability-after\eth-provenienz-erara-link\eth-provenienz-erara-link.component.ts

import { Component , OnInit, Input, inject } from '@angular/core';
import { Observable, catchError, map, of, Subject, tap, filter, switchMap, startWith, distinctUntilChanged, take } from 'rxjs';
import { EthProvenienzService } from './eth-provenienz.service'
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { EthUtilsService } from '../../services/eth-utils.service';
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { SHELL_ROUTER } from "../../injection-tokens";
import { EthProvenienzItem } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-provenienz',
  templateUrl: './eth-provenienz.component.html',
  styleUrls: ['./eth-provenienz.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule,
    SafeTranslatePipe    
  ]     
})
export class EthProvenienzComponent{
    private router = inject(SHELL_ROUTER);    
    vid!: string | null;
    tab!: string | null;
    scope!: string | null;
    items$!: Observable<EthProvenienzItem[]>;
    @Input() hostComponent: any = {};
    private mqListener: ((e: MediaQueryListEvent) => void) | null = null;
    //private cardPositioned = false;

    constructor(
      private ethProvenienzService: EthProvenienzService,
      private ethStoreService:EthStoreService,     
      private ethErrorHandlingService: EthErrorHandlingService,
      //private ethUtilsService: EthUtilsService
    ){}
   
    ngOnInit() {
      this.vid = this.ethStoreService.getVid();
      this.tab = this.ethStoreService.getTab();
      this.scope = this.ethStoreService.getScope();

      this.items$ = this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
        map(deliveryEntity => {
          if (!deliveryEntity) {
            return null;
          }
          const { delivery } = deliveryEntity;
          const url = delivery?.availabilityLinksUrl?.[0] ?? null;
          const owner = delivery?.recordOwner ?? '';

          if (!(owner === '41SLSP_ETH' && url?.includes('doi.org/10.3931/e-rara-'))) {
            return null;
          }

          return url.split('doi.org/')[1] ?? null;
        }),
        filter((doi): doi is string => !!doi),
        switchMap(doi =>
          this.ethProvenienzService.getItems(doi).pipe(
            map(response => response?.items ?? []),
            map(items => 
              items.map(i => ({
                ...i,
                url: `/search?vid=${this.vid}&tab=${this.tab}&search_scope=${this.scope}&query=${i.eth_doi_link.includes('doi.org/') ? i.eth_doi_link.split('doi.org/')[1] : ''}`
              }))
            ),
            /*tap( (items) => {
              if (items.length > 0 && !this.cardPositioned) {
                this.cardPositioned = true;
                this.mqListener = this.ethUtilsService.positionCard(
                  '.eth-provenance-cards'
                );
              }
            }),*/
            catchError(error => {
              this.ethErrorHandlingService.handleError(error,'EthProvenienzComponent.getDelivery');
               return of([]); 
            })
          )
        ),
        startWith([])
      );
    }

    ngOnDestroy() {
      if (this.mqListener) {
        const mq = window.matchMedia('(max-width: 599px)');
        mq.removeEventListener('change', this.mqListener);
      }
    }

    navigate(url: string, event: Event){
      event.preventDefault();  
      this.router.navigateByUrl(url);
    }    

} 
