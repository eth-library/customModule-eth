import { Component , OnInit, Input } from '@angular/core';
import { Observable, catchError, map, of, Subject, tap, filter, switchMap, startWith, distinctUntilChanged, take } from 'rxjs';
import { EthProvenienzService } from './eth-provenienz.service'
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { EthUtilsService } from '../../services/eth-utils.service';
import {TranslateModule, TranslateService} from "@ngx-translate/core";

interface EthProvenienzItem {
  id: string;
  eth_doi_link: string;
  eth_license: string;
  eth_link_to_the_digital_version_in_e_rara: string;
  eth_copyright_notice: string;
  eth_dating: string;
  description: string;
  title: string;
}

@Component({
  selector: 'custom-eth-provenienz',
  templateUrl: './eth-provenienz.component.html',
  styleUrls: ['./eth-provenienz.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule,
    TranslateModule    
  ]     
})
export class EthProvenienzComponent{
    vid!: string | null;
    tab!: string | null;
    scope!: string | null;
    items$!: Observable<EthProvenienzItem[]>;
    @Input() hostComponent: any = {};
    private mqListener: ((e: MediaQueryListEvent) => void) | null = null;
    private cardPositioned = false;
    labelOpenInNew$!: Observable<string>;

    constructor(
      private ethProvenienzService: EthProvenienzService,
      private ethStoreService:EthStoreService,     
      private ethErrorHandlingService: EthErrorHandlingService,
      private ethUtilsService: EthUtilsService,
      private translate: TranslateService          
    ){}
   
    ngOnInit() {
      this.vid = this.ethStoreService.getVid();
      this.tab = this.ethStoreService.getTab();
      this.scope = this.ethStoreService.getScope();
      this.labelOpenInNew$ = this.translate.get(`nui.aria.newWindow`);

      this.items$ = this.ethStoreService.getDeliveryEntity$().pipe(
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
            tap( (items) => {
              if (items.length > 0 && !this.cardPositioned) {
                this.cardPositioned = true;
                this.mqListener = this.ethUtilsService.positionCard(
                  '.eth-provenance-cards'
                );
              }
            }),
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

} 