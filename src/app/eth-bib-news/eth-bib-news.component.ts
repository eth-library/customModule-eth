import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EthBibNewsService } from './eth-bib-news.service';
import { catchError, map, Observable, of, startWith, switchMap } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe'; 

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

  news$: Observable<{ entries: any[], link: string } | null> = of(null);

  constructor(
    private translate: TranslateService,
    private ethBibNewsService: EthBibNewsService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngOnInit(): void {
    this.news$ = this.translate.onLangChange.pipe(
      startWith({ lang: this.translate.currentLang }), 
      switchMap((event:any) => this.ethBibNewsService.getNews(event.lang)),
      map(data => {
        if (!data) return null;
        data.entries?.forEach((n:any) => {
          if (n.appjson?.includes('library.ethz.ch')) {
            n.image = n.appjson.replace('library.ethz.ch', 'aem-newsimage-redirector.replit.app');
          }
        });
        return data;
      }),
      catchError((error) => {
        this.ethErrorHandlingService.handleError(error, 'EthBibNewsService')
        return of(null);
      })
    );
  }
  
}
