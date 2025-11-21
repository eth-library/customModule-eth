import { Component, ViewEncapsulation } from '@angular/core';
import { catchError, filter, forkJoin, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { EthPersonService } from '../services/eth-person.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';

@Component({ 
  selector: 'custom-eth-person-page',
  templateUrl: './eth-person-page.component.html',
  styleUrls: ['./eth-person-page.component.scss'],
  encapsulation: ViewEncapsulation.None,  
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    SafeTranslatePipe
  ]   
})

export class EthPersonPageComponent{
  private tab!: string;
  private scope!: string;
  private vid!: string;  
  private lang!: string;  
  
  person$!: Observable<any | null>;
  linkedDataEntityId$!: Observable<string>;
  
  constructor(
    private translate: TranslateService,
    public ethPersonService: EthPersonService,
    private ethStoreService:EthStoreService,         
    private ethErrorHandlingService: EthErrorHandlingService,
  ){}


  ngOnInit(): void {
    this.tab = this.ethStoreService.getTab();
    this.scope = this.ethStoreService.getScope();
    this.vid = this.ethStoreService.getVid();
    this.lang = this.translate.currentLang;
    // todo otb error entity page
    if(this.lang === 'undefined'){
      this.lang = 'de';
    }

    this.person$ = this.loadPerson();
  }

  private loadPerson(): Observable<any | null> {
    return this.ethStoreService.linkedDataEntityId$.pipe(
      filter(id => !!id),
      switchMap(id => {
        console.error("id",id)
        return this.ethPersonService.getPerson(id, this.lang).pipe(
          filter(data => !!data),
          map(data => {
            let person = this.ethPersonService.processPersonsResponse(data.results, this.lang);
            person['qid'] = data.qid?.[0] || null;
            person['label'] = person['entityfacts']?.preferredName || person['wiki']?.label || '';
            person['gnd'] = data.gnd?.find((g: string) => g !== '') || '';
            person['yearOfBirth'] = person['wiki']?.birth?.split('-')[0] 
                                || person['entityfacts']?.dateOfBirth?.split(' ').pop() 
                                || '';
            return person;
          }),
          switchMap(person => this.getPrecisionRecallLinks(person)),
          tap(() => setTimeout(() => this.resetPanelIds(), 100))
        );
      }),
      catchError(error => {
        this.ethErrorHandlingService.handleSynchronError(error, 'EthPersonPageComponent.ngAfterViewInit');
        return of(null);
      })
    );    
  }
  
  resetPanelIds(){
    const allPanels = document.querySelectorAll('.eth-personpage-links mat-expansion-panel');
    const start = 50;

    allPanels.forEach((panel, i) => {
      const headerId = `mat-expansion-panel-header-${i + start}`;
      const contentId = `cdk-accordion-child-${i + start}`;

      const header = panel.querySelector('mat-expansion-panel-header');
      const content = panel.querySelector('.mat-expansion-panel-content');

      if (header) {
        header.id = headerId;
        header.setAttribute('aria-controls', contentId);
      }
      if (content) {
        content.id = contentId;
        content.setAttribute('aria-labelledby', headerId);
      }
    });
  } 

  getPrecisionRecallLinks(person: any): Observable<any> {
    const queries = [];
    queries.push(this.getSearchLink(`any,contains,${person.label}`,'Suche nach Namen'));

    if (person.gnd) {
      queries.push(this.getSearchLink(`lds03,contains,${person.gnd}`,'Suche nach GND'));
    }

    let birthyearQuery = person.label;
    if (person.yearOfBirth && person.gnd) {
      birthyearQuery += ` AND (${person.yearOfBirth} OR ${person.gnd})`;
    } else if (person.yearOfBirth) {
      birthyearQuery += ` ${person.yearOfBirth}`;
    } else if (person.gnd) {
      birthyearQuery += ` ${person.gnd}`;
    }
    queries.push(this.getSearchLink(`any,contains,${birthyearQuery}`,'Suche nach Name und (GND oder Geburtsjahr)'));

    return forkJoin(queries).pipe(
      map(results => {
        person.searchVariants = results;
        return person;
      })
    );
  }

  getSearchLink(query: string, label: string): Observable<{ url: string; total: number; label: string } | null> {
    return this.ethPersonService.searchPrimoData(query, this.tab, this.scope, this.lang).pipe(
      map((data: any) => {
        const total = data?.info?.totalResultsLocal ?? 0;
        // TODO
        if(query.indexOf('lds03')===-1){
          query = query.replace('any,contains,','');
        }
        let url = `/nde/search?query=${query}&tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}&lang=${this.lang}`;
        if(query.indexOf('lds03')>-1){
          url += '&mode=advanced';
        }
        return { url, total, label };
      }),
      catchError((error) => {
        this.ethErrorHandlingService.handleError(error, 'EthPersonPageComponent.getPrecisionRecallLinks.getSearchLink');
        return of(null);
      })
    );
  }

}
