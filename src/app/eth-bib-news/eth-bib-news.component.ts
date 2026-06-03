// News items are displayed at the bottom of the home page.
// The news items are retrieved via a DAAS route from an AEM API
// https://jira.ethz.ch/browse/SLSP-2128

import { Component, inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EthBibNewsService } from './eth-bib-news.service';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe'; 
import { NewsFeedVM } from '../models/eth.model';

@Component({
  selector: 'custom-eth-bib-news',
  templateUrl: './eth-bib-news.component.html',
  styleUrls: ['./eth-bib-news.component.scss'],
  standalone: true,   
  imports: [CommonModule, SafeTranslatePipe]      
})
export class EthBibNewsComponent implements OnInit {
  private readonly LIBRARY_ETHZ_HOST = 'library.ethz.ch';
  private readonly REDIRECTOR_HOST = 'aem-newsimage-redirector.replit.app';
  private translate = inject(TranslateService);
  private ethBibNewsService = inject(EthBibNewsService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);

  news$: Observable<NewsFeedVM | null> | undefined;

  ngOnInit(): void {
    this.news$ = this.translate.onLangChange.pipe(
      map(event => event.lang),
      startWith(this.translate.currentLang),
      switchMap(lang => this.ethBibNewsService.getNews(lang)),
      map(feed => this.transformFeed(feed)),
      catchError((e) => {
        this.ethErrorHandlingService.logError(e, 'EthBibNewsComponent.news$');
        return of(null);
      })
    );
  }

  private transformFeed(feed: NewsFeedVM | null): NewsFeedVM | null {
    if (!feed?.entries) return null;

    return {
      ...feed,
      entries: feed.entries.map(entry => ({
          ...entry,
          // entry.appjson = image  url
          image: this.processImageUrl(entry.appjson)
      }))
    };
  }

  private processImageUrl(appjson?: string): string | undefined {
    if (!appjson?.includes(this.LIBRARY_ETHZ_HOST)) {
      return undefined;
    }
    return appjson.replace(this.LIBRARY_ETHZ_HOST, this.REDIRECTOR_HOST);
  }
}