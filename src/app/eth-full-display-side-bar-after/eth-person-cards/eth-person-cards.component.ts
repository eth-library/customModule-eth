// Person cards based on GND ID or IdRef in the right sidebar 
// https://jira.ethz.ch/browse/SLSP-2095

import { Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, defer, forkJoin, map, Observable, of, startWith, switchMap } from 'rxjs';
import { EthPersonService } from '../../services/eth-person.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { PnxDoc } from '../../models/eth.model';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { SHELL_ROUTER } from "../../injection-tokens";
import { HostComponent, PersonCardVM, PersonVM, PersonApiResponse, PersonResult } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-person-cards',
  templateUrl: './eth-person-cards.component.html',
  styleUrls: ['./eth-person-cards.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule,
    SafeTranslatePipe
  ]     
})

export class EthPersonCardsComponent {
    private router = inject(SHELL_ROUTER);  
    openLicensePopover: string | null = null;
    private hostComponent$ = new BehaviorSubject<HostComponent>({});

    @Input() set hostComponent(value: HostComponent) {
      this.hostComponent$.next(value ?? {});
    }

    @ViewChild('licensePopover') licensePopover?: ElementRef;
    @ViewChild('licensePopoverTrigger') licensePopoverTrigger?: ElementRef;    
    

    constructor(
      private translate: TranslateService,
      public ethPersonService: EthPersonService,
      private ethErrorHandlingService: EthErrorHandlingService,
      private ethStoreService:EthStoreService,
    ){}

    persons$: Observable<PersonCardVM | null> = defer(() => {
      const record$ = this.hostComponent$.pipe(
        switchMap(host => this.ethStoreService.getRecord$(host))
      );
      const lang$ = this.translate.onLangChange.pipe(
        map(event => event.lang),
        startWith(this.translate.currentLang)
      );

      return combineLatest([record$, lang$]).pipe(
        switchMap(([record, lang]) => this.loadPersons(record, lang || 'de')),
        switchMap((persons: PersonVM[]) =>
          this.ethStoreService.linkedDataRecommendations$.pipe(
            map((entities) => this.filterPersons(persons, entities))
          )
        ),
        catchError(err => {
          this.ethErrorHandlingService.logSyncError( err, 'EthPersonCardsComponent persons$');
          return of({'otbPersons': [],'filteredPersons': []});      
        })
      );
    });

    private loadPersons(record: PnxDoc, lang: string): Observable<PersonVM[]> {
      const gndList = this.getGndIds(record);     
      const idRefList = this.getIdRefs(record);   
      const gndFromIdRef$ = idRefList.map(idref => this.ethPersonService.getGndByIdRef(idref));

      const gndStream$ = gndFromIdRef$.length > 0
        ? forkJoin(gndFromIdRef$)
        : of([]);
    
      return gndStream$.pipe(
        // prepare list of gnd and idref
        map((gndsFromIdRef: (string | null)[]) => {
          const resolvedGnds = gndsFromIdRef.filter((id): id is string => Boolean(id));
          const allGnds = Array.from(new Set([...gndList, ...resolvedGnds]));
          return allGnds.length > 0 ? allGnds.join(',') : null;
        }),
        
        // get person data from personService
        switchMap((allGnds: string | null) => {
          if (!allGnds) {
            return of({results: []});
          }
          return this.ethPersonService.getPersons(allGnds, lang);
        }),

        // normalize response
        map((response: PersonApiResponse) => {
          if (!response?.gnd?.length) return [];
    
          const groupedResults = response.results.reduce((acc: Record<string, any[]>, person: PersonResult) => {
            if (person.gnd) {
              (acc[person.gnd] ||= []).push(person);
            }
            return acc;
          }, {});
          return response.gnd
            .map((gnd: string) => {
                return groupedResults[gnd] ? this.ethPersonService.processPersonsResponse({gnd: [gnd], results: groupedResults[gnd]}, lang) : {gnd: '', url: ''}
              }
            )
            .filter(Boolean)
            .filter((person: PersonVM) => person.entityfacts?.preferredName || person.wiki?.label);             
        }),
        catchError(error => {
          this.ethErrorHandlingService.logError(error, 'EthPersonCardsComponent.loadPersons');
          return of([]);
        })
      )
    }

    private filterPersons(persons: PersonVM[], entities: any[] | null | undefined): PersonCardVM {
      const entityIds = new Set(
        (entities ?? [])
          .map((e: any) => e.id)
          .filter((id: string | null | undefined): id is string => Boolean(id))
      );

      const filteredPersons = persons.filter((person: any) => {
        const lccn = person.entityfacts?.lccn || person.wiki?.loc;
        if (!lccn) {
          return true;
        }
        return !entityIds.has(lccn);
      });

      return {
        otbPersons: entities ?? [],
        filteredPersons: filteredPersons
      };
    }
        
    private getGndIds(record: PnxDoc): string[] {
      const lds03 = record?.pnx?.display?.['lds03'] ?? [];
      return lds03.map( l => {
        l = l.replace('(DE-588)', '');
        // Alma:   GND: <a target="_blank" href="https://explore.gnd.network/gnd/1271627787"> Compagno, Loris 1993-</a>
        if (l.includes('/gnd/')) {
          return l.substring(l.indexOf('gnd/') + 4, l.indexOf('">'));
        }
        // externe Daten:   GND: Prelog, Vladimir (rela): 119247496
        else if (l.includes('GND:')) {
          return l.substring(l.lastIndexOf(': ') + 2).trim();
        }
        else{
          return null;          
        }
      }).filter((id): id is string => Boolean(id));
    }

    private getIdRefs(record: PnxDoc): string[] {
      const lds03 = record?.pnx?.display?.['lds03'] ?? [];
     
      return Array.from(
        new Set(
          lds03.map(entry => {
            const match = entry.match(/idref\.fr\/([^">]+)/);
            return match?.[1] ?? null;
          }).filter((id): id is string => Boolean(id))
        )
      );
    }

    navigate(url: string, event: Event){
      event.preventDefault(); 
      this.router.navigateByUrl(url + "#eth-top");
    }   
    
    open(key: string) {
      this.openLicensePopover = key;
      setTimeout(() => {
        this.licensePopover?.nativeElement?.focus();
      });
    }

    close() {
      this.openLicensePopover = null;
      setTimeout(() => {
        this.licensePopoverTrigger?.nativeElement?.focus();
      });
    }

    toggle(key: string) {
      this.isOpen(key) ? this.close() : this.open(key);
    }

    isOpen(key: string): boolean {
      return this.openLicensePopover === key;
    }        

    onFocusOut(event: FocusEvent) {
      const next = event.relatedTarget as HTMLElement | null;
      if (!this.licensePopover?.nativeElement.contains(next)) {
        this.close();
      }
    }    
}

