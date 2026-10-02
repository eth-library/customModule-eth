/*
Example: 99117429500405503
For online resources, an email link is generated which can be used to report access issues.
The Alma MMS ID and the title are already included in the subject line of the email.
The body of the email contains various metadata, the requesting URL and the user agent. 
The email is sent to almakb@library.ethz.ch.
*/
// https://jira.ethz.ch/browse/SLSP-1997

import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { catchError, defer, filter, map, Observable, of } from 'rxjs';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from "@ngx-translate/core";
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { PnxDoc } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-online-problem',
  standalone: true,
  imports: [
    CommonModule,
    SafeTranslatePipe
  ],
  templateUrl: './eth-online-problem.component.html',
  styleUrl: './eth-online-problem.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class EthOnlineProblemComponent {
  private ethStoreService = inject(EthStoreService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private translate = inject(TranslateService);
  
  readonly mailLink$: Observable<string | null> = defer(() =>
    this.ethStoreService.getFullDisplayRecord$().pipe(
      filter((record): record is PnxDoc => record !== null),
      map(record => this.buildMailLink(record)),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthOnlineProblemComponent.mailLink$');
        return of(null);
      })
    )
  );
  
  private buildMailLink(record: PnxDoc): string {
    // instant instead of stream: email is not different for different languages -> one time is enough
    const ACCESS_PROBLEM_EMAIL = this.translate.instant('eth.onlineProblem.mail');
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

    const subject = `Report access problem: ${mmsId} - "${title}"`;

    return `mailto:${ACCESS_PROBLEM_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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
