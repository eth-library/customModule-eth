// For online resources, an email link is generated that can be used to report access problems.
// https://jira.ethz.ch/browse/SLSP-1997

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, defer, filter, map, Observable, of, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from 'src/app/services/eth-error-handling.service';
import {TranslateModule} from "@ngx-translate/core";
import { PnxDoc } from '../../models/eth.model';

const ACCESS_PROBLEM_EMAIL = 'almakb@library.ethz.ch';

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
  mailLink = '';

  constructor(
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  readonly showLink$: Observable<boolean> = defer(() =>
    this.ethStoreService.getFullDisplayRecord$().pipe(
      filter((record): record is PnxDoc => record !== null),
      tap(record => this.setMailLink(record)),
      map(() => true),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthOnlineProblemComponent.showLink$');
        return of(false);
      })
    )
  );
  
  private setMailLink(record:PnxDoc): void {
    const mmsId = record?.pnx?.control?.recordid?.[0] ?? '';
    const title = record?.pnx?.display?.title?.[0] || '';
    const creationdate = record?.pnx?.display?.creationdate?.[0] || '';
    const creator = record?.pnx?.display?.creator?.join(', ') || '';
    const publisher = record?.pnx?.display?.publisher?.[0] || '';
    const type = record?.pnx?.display?.type?.[0] || '';
    const identifier = this.extractIdentifier(record);
    const url = location.href;
    const userAgent = navigator.userAgent;

    const body = `** Attached Metadata **
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

    this.mailLink = `mailto:${ACCESS_PROBLEM_EMAIL}?subject=Report access problem: ${mmsId} - "${title}"&body=${encodeURIComponent(body)}`;
  }

  private extractIdentifier(record: PnxDoc): string {
    const identifiers = record?.pnx?.display?.identifier ?? [];
    if (identifiers.length === 0) return '';

    const ident = identifiers[0] ?? '';
    if (ident.includes('<b>ISBN') || ident.includes('<b>ISSN')) {
      return identifiers.join(', ').replace(/<\/b>/g, '').replace(/<b>/g, '');
    }
    if (ident.includes('$$V') && ident.includes('ISBN')) {
      return `ISBN: ${ident.substring(ident.indexOf('$$V') + 3)}`;
    }
    if (ident.includes('$$V') && ident.includes('ISSN')) {
      return `ISSN: ${ident.substring(ident.indexOf('$$V') + 3)}`;
    }
    if (ident.includes('$$V') && ident.includes('DOI')) {
      return `DOI: ${ident.substring(ident.indexOf('$$V') + 3)}`;
    }
    return ident;
  }
}
