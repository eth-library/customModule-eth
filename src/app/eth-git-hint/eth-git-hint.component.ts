/**
A hint in the header is retrieved from Git.
The hint is inserted as HTML (link as link, not as HTML code).
https://eth-library.github.io/snippets/primo/banner.json
Only certain tags are allowed in the hint:
allowedTags = [‘a’, ‘strong’, ‘em’, ‘p’, ‘br’]
For security reasons, all other elements are removed.
Angular's own sanitizer then automatically runs over it again.
 */
// https://jira.ethz.ch/browse/SLSP-1958

import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { EthGitHintService } from './eth-git-hint.service'
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthUtilsService } from '../services/eth-utils.service';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe'; 

type Language = 'de' | 'en'; 

/* Attention: no encapsulation for css! */

@Component({
  selector: 'custom-eth-git-hint',
  templateUrl: './eth-git-hint.component.html',
  styleUrls: ['./eth-git-hint.component.scss'],
  standalone: true,   
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]    
})
export class EthGitHintComponent implements OnInit {
  
  hint$!: Observable<SafeHtml | null>;

  constructor( 
    private translate: TranslateService,
    private ethGitHintService: EthGitHintService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethUtilsService: EthUtilsService
  ) {}

  ngOnInit() {
    let currentLang: Language = this.translate.currentLang as Language || 'de';
    this.hint$ = this.ethGitHintService.getHint(currentLang).pipe(
      map(hint => this.ethUtilsService.sanitizeText(hint)),
      catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthGitHintComponent'))
    );
  }

}
