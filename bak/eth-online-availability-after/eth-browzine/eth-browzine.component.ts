import { Component , OnInit, Input, effect } from '@angular/core';
import { Observable, catchError, of, switchMap } from 'rxjs';
import { EthBrowzineService } from './eth-browzine.service'
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { toObservable } from '@angular/core/rxjs-interop';

@Component({
  selector: 'custom-eth-browzine',
  standalone: true,
  templateUrl: './eth-browzine.component.html',
  styleUrls: ['./eth-browzine.component.scss'],
  imports: [
    CommonModule
  ]     
})
export class EthBrowzineComponent {
  @Input() hostComponent: any = {};
  searchResult: any;
  journalLink$!: Observable<string | null>;

  
  constructor(
    private ethBrowzineService: EthBrowzineService,
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}


  ngOnInit() {
    this.journalLink$ = this.ethStoreService.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getJournalLink(record))
    )
  }
/*
  ngAfterViewInit() {
    effect(() => {
      const record = this.hostComponent.searchResultSignal(); 
      console.error("signal record",record)
      if (record) {
        this.getJournalLink(record).subscribe(link => {
          console.log(link); 
        });
      }
    });
  }   
*/
  /*ngOnInit() {
      if (this.hostComponent?.searchResultSignal) {
        const record$ = toObservable(this.hostComponent.searchResultSignal);

        this.journalLink$ = record$.pipe(
          switchMap(record => this.getJournalLink(record))
        );
      }
  }*/
 
  private getJournalLink(searchResult: any): Observable<string | null> {    
    const type = this.getType(searchResult);
    const issns = this.getIssns(searchResult);

    if(type !== 'journal' && type !== 'eJournal' && type !== 'Zeitschrift' || !issns){
      return of(null);
    }
    // todo check onCampus?
    return this.ethBrowzineService.getJournalLink(issns).pipe(
      catchError((error) => {
        console.error('Error fetching journal for: ' + issns, error);
        return of(null);
      })
    )
  }

  private getType(searchResult: any): string | null {
    return searchResult?.pnx?.display?.['type']?.[0] || null;
  }  

  private getIssns(searchResult: any): string | null {
    const issns = searchResult?.pnx?.addata?.issn;
    return Array.isArray(issns) ? issns.map(i => i.replace(/-/g, '')).join(',') : null;
  }  
  
}
