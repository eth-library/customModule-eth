import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';
import { EthGitHintService } from './eth-git-hint.service'
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthUtilsService } from '../services/eth-utils.service';

type Language = 'de' | 'en'; 

/* Attention: no encapsulation for css! */

@Component({
  selector: 'custom-eth-git-hint',
  templateUrl: './eth-git-hint.component.html',
  styleUrls: ['./eth-git-hint.component.scss'],
  standalone: true,   
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule
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
