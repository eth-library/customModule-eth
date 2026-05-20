// In the online section, an offcampus warning is displayed next to the online link when appropriate, e.g., not for open access.
// If you are off-campus and the resource does not have an OA flag, the delivery is checked in this order:
// - If the resource has a “Remote Search Resource” category, it is usually from an external data source, so the warning is not displayed.
//    However, there are cases where a CDI resource has this category (and not Alma-E), e.g. cdi_arxiv_primary_2310_06557,
//    a resource from Scopus. CDI knows, but something still needs to be loaded.
//    That is why the “Remote Search Resource” category is checked together with if it is a CDI resource. 
//    If the category is set and it is not a CDI resource -> no warning (external data source).
// - publicNote === “Online access via the World Wide Web” -> no warning
// - from the library stack -> no warning
// - If the category “Remote Search Resource” is set and it is a CDI resource -> warning.
// - If the category “Alma-E” is set -> warning.

// https://jira.ethz.ch/browse/SLSP-1995

import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { catchError, defer, map, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from '../services/eth-store.service';
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
  private ethStoreService = inject(EthStoreService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  isOnCampus$: Observable<boolean> = defer(() => this.ethStoreService.isOnCampus$);
  
  showWarning$: Observable<boolean> = this.isOnCampus$.pipe(
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
            map(deliveryEntity => this.shouldShowWarningBasedOnDelivery(deliveryEntity))
          );
        })
      );
    }),
    catchError(err => {
      this.ethErrorHandlingService.logError(err, 'EthOffcampusWarningComponent.showWarning$');
      return of(false);
    })
  );
  private shouldShowWarningBasedOnDelivery(deliveryEntity: unknown): boolean {
    const category = (deliveryEntity as { delivery?: { deliveryCategory?: string } })?.delivery?.deliveryCategory ?? '';
    const services = (deliveryEntity as { delivery?: { electronicServices?: unknown[] } })?.delivery?.electronicServices;
    const firstIlsApiId = Array.isArray(services)
      ? (services[0] as { ilsApiId?: string })?.ilsApiId ?? ''
      : '';

    //console.error("category",category)

    // external datasource (not in CDI)
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

    // Alma-E: external licensed electronic resources
    // Remote Search Resource in CDI, eg. Scopus: CDI knows ist, but mite is remotely loaded
    // Example: cdi_arxiv_primary_2310_06557 
    return category.includes('Alma-E') || category.includes('Remote Search Resource');
  }
  
}
