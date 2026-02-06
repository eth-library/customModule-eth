// In the online section, an offcampus note is displayed next to the online link when appropriate, e.g., not for open access.
// https://jira.ethz.ch/browse/SLSP-1995

import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: 'custom-eth-offcampus-warning',
  templateUrl: './eth-offcampus-warning.component.html',
  styleUrls: ['./eth-offcampus-warning.component.scss'],
  standalone: true,     
  imports: [
    CommonModule,
    TranslateModule
  ]     
})
export class EthOffcampusWarningComponent {
  
  isOnCampus$: Observable<boolean> = of(false);
  showWarning$: Observable<boolean> = of(false);
   
  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  ngOnInit() {
    this.isOnCampus$ = this.ethStoreService.isOnCampus$;
    
    this.showWarning$ = this.isOnCampus$.pipe(
      switchMap(onCampus => {
        // onCampus -> no warning
        if (onCampus) {
          return of(false);
        }
        // offCampus -> check open access
        return this.ethStoreService.getFullDisplayRecord$().pipe(
          switchMap(record => {
            if (record?.pnx?.addata?.['openaccess']?.[0] === 'true') {
              // oa -> no warning
              return of(false);
            }
            // no oa -> check delivery category
            return this.ethStoreService.getFullDisplayDeliveryEntity$().pipe(
              map(deliveryEntity => this.shouldShowWarning(deliveryEntity))
            );
          })
        );
      }),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthOffcampusWarningComponent.ngOnInit()');
        return of(false);
      })      
    );
  }

  private shouldShowWarning(deliveryEntity: unknown): boolean {
    const category = (deliveryEntity as { delivery?: { deliveryCategory?: string } })?.delivery?.deliveryCategory ?? '';
    const services = (deliveryEntity as { delivery?: { electronicServices?: unknown[] } })?.delivery?.electronicServices;
    const firstIlsApiId = Array.isArray(services)
      ? (services[0] as { ilsApiId?: string })?.ilsApiId ?? ''
      : '';

    if (!firstIlsApiId.includes('cdi_') && category.includes('Remote Search Resource')) {
      return false;
    }

    const hasPublicNote = Array.isArray(services)
      ? services.some(service => (service as { publicNote?: string })?.publicNote === 'Onlinezugriff via World Wide Web')
      : false;
    if (hasPublicNote) {
      return false;
    }

    const recordId = (deliveryEntity as { recordId?: string })?.recordId ?? '';
    if (recordId.includes('cdi_librarystack')) {
      return false;
    }

    return category.includes('Alma-E') || category.includes('Remote Search Resource');
  }
  
}

/**
eth.offcampusWarning.text1
ETH Library’s licensed e-resources are accessible via the ETH network or 
Lizenzierte E-Ressourcen der ETH-Bibliothek sind über das ETH-Netzwerk oder 

eth.offcampusWarning.text2
.
zugänglich.

eth.offcampusWarning.url
https://unlimited.ethz.ch/en/help/network/vpn
https://unlimited.ethz.ch/help/network/vpn
*/
