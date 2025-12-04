import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { EthConnectedpapersService } from './eth-connectedpapers.service'
import { catchError, filter, map, Observable, of, switchMap } from 'rxjs';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';

type FullDisplayState = {selectedRecordId:string};
const selectFullDisplayState = createFeatureSelector<FullDisplayState>('full-display');
const selectFullDisplayRecordId = createSelector(selectFullDisplayState, state => state.selectedRecordId ?? null);

type SearchParams = {q:string, tab:string, scope:string}
type SearchState = {searchParams: SearchParams, ids: string[], entities: Record<string, any>}
const selectSearchState = createFeatureSelector<SearchState>('Search');
const selectSearchEntities = createSelector(selectSearchState, state => state.entities);

const selectListviewRecord = (recordId: string) =>
  createSelector(
    selectSearchEntities,
    entities => entities[recordId] ?? null
  );

const selectFullDisplayRecord = createSelector(
  selectFullDisplayRecordId,
  selectSearchEntities,
  (selectedId, entities) =>
    selectedId ? entities[selectedId] : null
);

@Component({
  selector: 'custom-eth-connectedpapers',
  templateUrl: './eth-connectedpapers.component.html',
  styleUrl: './eth-connectedpapers.component.scss',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]    
})

export class EthConnectedpapersComponent{
  private store = inject(Store);
  @Input() hostComponent: any = {};
  searchResult: any;
  url$!: Observable<string | null>;

  constructor(
    private ethConnectedpapersService: EthConnectedpapersService,
  ){}


  ngOnInit() {
    //console.error("hostComponent",this.hostComponent)
    this.url$ = this.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getPaper(record))
    )
  }
  
  
  private getPaper(record: any): Observable<string | null> {    
    try{
      const doi = this.getDoi(record);
      if (!doi) {
        return of(null);
      }
      const type = this.getType(record);
      if (type !== 'article' && type !== 'articles' && type !== 'book_chapter') {
        return of(null);
      }
      return this.ethConnectedpapersService.getPaperViaProxy(doi).pipe(
        //tap(response => console.error('response', response)),
        filter(response => response !== null),
        map(response => {
            if((response?.citationCount && response?.citationCount > 0) || (response?.referenceCount && response?.referenceCount > 0)){
                return `https://www.connectedpapers.com/main/${response.id}/graph?utm_source=primonde`;
            }
            else{
              return null;
            }
        }),
        catchError(error => {
          console.error('error in Connectedpapers addon: map', error);
          return of(null);
        })
      );
    }
    catch(error: any){
        console.error('error in Connectedpapers addon: getPaper() ', error);
        return of(null);
    }
  }

  private getType(record: any): string | null {
    return record?.pnx?.display?.type?.[0] || null;
  }  

  private getDoi(record: any): string | null {
    return record?.pnx?.addata?.doi?.[0] || null;
  }  

  getRecord$(hostComponent: any) {
    const recordId = hostComponent?.searchResult?.pnx?.control?.recordid[0];
    return this.store.select(selectFullDisplayRecord).pipe(
      switchMap(record =>
        record
          ? of(record)
          : this.store.select(selectListviewRecord(recordId))
      )
    );
  }

  /*ngAfterViewInit() {
    effect(() => {
      const record = this.hostComponent.searchResultSignal(); 
      console.error("signal record",record)
    });
  } */
     
}

  
