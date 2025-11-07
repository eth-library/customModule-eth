import { CommonModule } from '@angular/common';
import { Component} from '@angular/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import {TranslateModule} from "@ngx-translate/core";

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
  
  isOnCampus$!: Observable<boolean>;
  showWarning$!: Observable<boolean>;
   
  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  ngOnInit() {
    this.isOnCampus$ = this.ethStoreService.isOnCampus$;
    
    this.showWarning$ = this.isOnCampus$.pipe(
      switchMap(onCampus => {
        // onCampus -> no warning
        // todo: remove inversion
        if (!onCampus) {
          return of(false);
        }
        // offCampus -> check open access
        return this.ethStoreService.getFullviewRecord$().pipe(
          switchMap(record => {
            if (record?.pnx?.addata?.['openaccess']?.[0] === 'true') {
              // oa -> no warning
              return of(false);
            }
            // no oa -> check delivery category
            return this.ethStoreService.getDeliveryEntity$().pipe(
              map(deliveryEntity => {
                //console.error("deliveryEntity",deliveryEntity)
                const category = deliveryEntity?.delivery?.deliveryCategory ?? "";
                // external data source
                if(deliveryEntity?.delivery?.electronicServices?.[0].ilsApiId.indexOf("cdi_") === -1 && category.indexOf('Remote Search Resource') > -1){
                    return false;
                }
                // public note
                let hasPublicNote = deliveryEntity?.delivery?.electronicServices?.some((e:any) => {return e.publicNote === "Onlinezugriff via World Wide Web"});
                if(hasPublicNote)return false;
                // library stack
                if (deliveryEntity?.recordId.indexOf('cdi_librarystack')>-1){
                  return false;
                }
                return category.indexOf('Alma-E') > -1 || category.indexOf('Remote Search Resource') > -1;
              })
            );
          })
        );
      }),
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthOffcampusWarningComponent');
        return of(false);
      })      
    );
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
