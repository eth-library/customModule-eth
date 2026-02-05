// News feed on the home page
// https://jira.ethz.ch/browse/SLSP-2128

import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EthBibNewsService } from './eth-bib-news.service';
import { catchError, map, Observable, of, startWith, switchMap, throwError } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe'; 
import { NewsFeedVM } from '../models/eth.model';

@Component({
  selector: 'custom-eth-bib-news',
  templateUrl: './eth-bib-news.component.html',
  styleUrls: ['./eth-bib-news.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]      
})

export class EthBibNewsComponent implements OnInit {

  news$: Observable<NewsFeedVM | null> = of(null);

  constructor(
    private translate: TranslateService,
    private ethBibNewsService: EthBibNewsService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngOnInit(): void {
    this.news$ = this.translate.onLangChange.pipe(
      map(event => event.lang),
      startWith(this.translate.currentLang),
      switchMap(lang => this.ethBibNewsService.getNews(lang)),
      map(feed => {
          if (!feed) return null;
          return {
            ...feed,
            entries: feed.entries.map(entry => ({
              ...entry,
              image: entry.appjson?.includes('library.ethz.ch') ? entry.appjson.replace('library.ethz.ch','aem-newsimage-redirector.replit.app') : undefined
            }))
          };
        }),      
      catchError((e) => {
        this.ethErrorHandlingService.logError(e, 'EthBibNewsComponent.ngOnInit()')
        return throwError(() => e);        
      })
    );
  }
  
}
