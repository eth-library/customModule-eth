// Test DOI 10.1093/nar/gkw1070
import { Component , OnInit, Input, Inject, Optional, AfterViewInit } from '@angular/core';
import { Observable, catchError, filter, map, of, switchMap, tap } from 'rxjs';
import { EthFulltextService } from './eth-fulltext.service'
import { ArticleLink } from '../../models/article.model';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'custom-eth-fulltext',
  standalone: true, 
  templateUrl: './eth-fulltext.component.html',
  styleUrls: ['./eth-fulltext.component.scss'],
  imports: [
    CommonModule
  ]  
})

export class EthFulltextComponent implements OnInit{

  @Input() hostComponent: any = {};
  articleLink$!: Observable<ArticleLink | null>;

  constructor(
    private ethFulltextService: EthFulltextService,
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}

  ngOnInit() {
    this.articleLink$ = this.ethStoreService.getRecord$(this.hostComponent).pipe(
      map(record => this.getDoi(record)),
      switchMap(doi => {
        if (!doi) {
          return of(null);
        }
        return this.ethStoreService.isOnCampus$.pipe(
          switchMap(isOnCampus =>
            this.ethFulltextService.getArticleLink$(doi, isOnCampus)
          )
        );
      }),
      catchError(error => {
        this.ethErrorHandlingService.handleError(error, 'EthFulltextComponent');
        return of(null);
      })
    );
  }

  private getDoi(record: any): string | null {
    return record?.pnx?.addata?.['doi']?.[0] || null;
  }  

}
  
