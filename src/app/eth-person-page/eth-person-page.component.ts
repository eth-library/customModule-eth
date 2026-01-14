// EntityPage Person
// https://jira.ethz.ch/browse/SLSP-1990

import { Component, inject, ViewEncapsulation } from '@angular/core';
import { catchError, filter, forkJoin, map, Observable, of, startWith, Subject, switchMap, tap } from 'rxjs';
import { EthPersonService } from '../services/eth-person.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import { SHELL_ROUTER } from "../injection-tokens";
import { PersonVM, SearchVariantVM, PrimoApiResponse } from '../models/eth.model';

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
  private router = inject(SHELL_ROUTER); 
  private lang!: string;  
  
  person$!: Observable<PersonVM | null>;
  linkedDataEntityId$!: Observable<string>;
  
  constructor(
    private translate: TranslateService,
    public ethPersonService: EthPersonService,
    private ethStoreService:EthStoreService,         
    private ethErrorHandlingService: EthErrorHandlingService,
  ){}


  ngOnInit(): void {
    if (!this.router.url.includes('/entity/person')) {
      return;
    }

    this.lang = this.translate.currentLang || 'de';
    this.person$ = this.translate.onLangChange.pipe(
      startWith({ lang: this.lang } as LangChangeEvent), 
      switchMap(evt => {
        this.lang = evt.lang;
        return this.loadPerson();
      })
    );
  }
  
  private loadPerson(): Observable<PersonVM | null> {
    return this.ethStoreService.linkedDataEntityId$.pipe(
      filter(id => !!id),
      switchMap(id => {
        return this.ethPersonService.getPerson(id, this.lang).pipe(
          filter(data => !!data),
          map(data => {
            let person = this.ethPersonService.processPersonsResponse(data, this.lang);
            person['qid'] = data.qid?.[0];
            person['label'] = person['entityfacts']?.preferredName || person['wiki']?.label || '';
            person['gnd'] = data.gnd?.find((g: string) => g !== '') || '';
            person['yearOfBirth'] = person['wiki']?.birth?.split('-')[0] 
                                || person['entityfacts']?.birthDate?.split(' ').pop() 
                                || '';
            return person;
          }),
          switchMap(person => this.getPrecisionRecallLinks(person)),
          tap(() => setTimeout(() => this.resetPanelIds(), 100))
        );
      }),
      catchError(error => {
        this.ethErrorHandlingService.logSyncError(error, 'EthPersonPageComponent.ngAfterViewInit');
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

  getPrecisionRecallLinks(person: PersonVM): Observable<PersonVM> {
    const queries = [];
    queries.push(this.getSearchLink(`any,contains,${person.label}`));

    if (person.gnd) {
      queries.push(this.getSearchLink(`lds03,contains,${person.gnd}`));
    }

    let birthyearQuery = person.label;
    if (person.yearOfBirth && person.gnd) {
      birthyearQuery += ` AND (${person.yearOfBirth} OR ${person.gnd})`;
    } else if (person.yearOfBirth) {
      birthyearQuery += ` ${person.yearOfBirth}`;
    } else if (person.gnd) {
      birthyearQuery += ` ${person.gnd}`;
    }
    queries.push(this.getSearchLink(`any,contains,${birthyearQuery}`));

    return forkJoin(queries).pipe(
      map(results => {
        person.searchVariants = results.filter(
          (r): r is SearchVariantVM => r !== null
        );
        return person;
      })
    );
  }

  getSearchLink(query: string ): Observable<SearchVariantVM | null> {
    const tab = this.ethStoreService.getTab() || '';
    const scope = this.ethStoreService.getScope() || '';
    const vid = this.ethStoreService.getVid() || '';
    return this.ethPersonService.searchPrimoData(query, tab, scope, this.lang).pipe(
      map((data: PrimoApiResponse) => {
        const total = data?.info?.totalResultsLocal ?? 0;
        if(query.indexOf('lds03')===-1){
          query = query.replace('any,contains,','');
        }
        let url = `/search?query=${query}&tab=${tab}&search_scope=${scope}&vid=${vid}&lang=${this.lang}`;
        if(query.indexOf('lds03')>-1){
          url += '&mode=advanced';
        }
        return { url, total };
      }),
      catchError((error) => {
        this.ethErrorHandlingService.logError(error, 'EthPersonPageComponent.getSearchLink');
        return of(null);
      })
    );
  }

  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }      

}