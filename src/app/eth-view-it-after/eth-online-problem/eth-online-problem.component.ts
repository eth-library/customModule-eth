import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from 'src/app/services/eth-error-handling.service';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'custom-eth-online-problem',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './eth-online-problem.component.html',
  styleUrl: './eth-online-problem.component.scss'
})

export class EthOnlineProblemComponent {
  showLink$!: Observable<boolean>;
  mailLink!: string;

  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  ngOnInit() {
    this.showLink$ = this.ethStoreService.getFullviewRecord$().pipe(
      switchMap(record => {
        //console.error("record",record)
        /*const isFromHSA = record?.pnx?.control?.originalsourceid?.[0]?.includes('hochschularchiv-der-eth') ?? false;
        if(isFromHSA){
          return of(false);
        }
        else{
          this.setMailLink(record);
          return of(true);
        }*/
        this.setMailLink(record);
        return of(true);
      }),
      catchError(err => {
        this.ethErrorHandlingService.handleError(err, 'EthOnlineProblemComponent');
        return of(true);
      })      
    );
  }
  
  setMailLink(record:any){
    let mmsId = record?.pnx?.control?.recordid[0];
    let title = record?.pnx?.display?.title?.[0] || '';
    let creationdate = record?.pnx?.display?.creationdate?.[0] || '';
    let creator = record?.pnx?.display?.creator?.join(', ') || '';
    let publisher = record?.pnx?.display?.publisher?.[0] || '';
    //let jtitle = record?.pnx?.addata?.jtitle?.[0] || '';
    let type = record?.pnx?.display?.type?.[0] || '';
    let identifier = '';
    if(record?.pnx?.display?.identifier && record?.pnx?.display?.identifier?.length > 0){
        let ident = record?.pnx?.display?.identifier[0];
        if(ident.indexOf('<b>ISBN')>-1){
            identifier = record?.pnx?.display?.identifier.join(', ').replace(/<\/b>/g, '').replace(/<b>/g, '');
        }
        else if(ident.indexOf('<b>ISSN')>-1){
            identifier = record?.pnx?.display?.identifier.join(', ').replace(/<\/b>/g, '').replace(/<b>/g, '');
        }
        else if(ident.indexOf('$$V')>-1 && ident.indexOf('ISBN')>-1){
            identifier = 'ISBN: ' + ident.substring(ident.indexOf('$$V') + 3);
        }
        else if(ident.indexOf('$$V')>-1 && ident.indexOf('ISSN')>-1){
            identifier = 'ISSN: ' + ident.substring(ident.indexOf('$$V') + 3);
        }
        else if(ident.indexOf('$$V')>-1 && ident.indexOf('DOI')>-1){
            identifier = 'DOI: ' + ident.substring(ident.indexOf('$$V') + 3);
        }
        else{
          identifier = ident;
        }
    }
    let url = location.href;
    let userAgent = navigator.userAgent;    

let body= `** Attached Metadata **
Title: ${title}
Author: ${creator}
Publisher: ${publisher}
Year: ${creationdate}
Type: ${type}
DocId: ${mmsId}
Identifier: ${identifier}
URL: ${url}
USER_AGENT: ${userAgent}
****

Please describe the access problem briefly:
`;

    this.mailLink = `mailto:almakb@library.ethz.ch?subject=Report access problem: ${mmsId} - "${title}"&body=${encodeURIComponent(body)}`;
  }
}
