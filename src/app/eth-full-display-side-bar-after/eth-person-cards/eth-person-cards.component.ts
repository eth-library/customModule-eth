// Person cards based on GND ID or IdRef in the right sidebar 
// https://jira.ethz.ch/browse/SLSP-2095

import { Component, inject, Input } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { EthPersonService } from '../../services/eth-person.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthUtilsService } from '../../services/eth-utils.service';
import { PnxDoc } from '../../models/eth.model';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { SafeTranslatePipe } from '../../pipes/safe-translate.pipe';
import { EthMatomoService } from '../../eth-matomo/eth-matomo.service';
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
    openGnd: string | null = null;
    persons$!: Observable<PersonCardVM | null>; 
    @Input() hostComponent: HostComponent = {};
    private mqListener: ((e: MediaQueryListEvent) => void) | null = null;    
    private cardPositioned = false;
      @Input() parentCtrl: any;
    
    constructor(
      private translate: TranslateService,
      public ethPersonService: EthPersonService,
      private ethErrorHandlingService: EthErrorHandlingService,
      private ethStoreService:EthStoreService,    
      private ethUtilsService: EthUtilsService,
      private matomoService: EthMatomoService,
    ){}

    ngOnInit(): void {

      this.persons$ = this.ethStoreService.getRecord$(this.hostComponent).pipe(
        switchMap(record => this.loadPersons(record)),
        /*tap( (persons) => {
          if(persons.filteredPersons.length > 0 && !this.cardPositioned) {
            this.cardPositioned = true;
            this.mqListener = this.ethUtilsService.positionCard('.eth-person-cards');
          }
        })*/
        catchError(err => {
          this.ethErrorHandlingService.logSyncError( err, 'EthPersonCardsComponent.ngOnInit');
          return of({'otbPersons': [],'filteredPersons': []});      
        })

      )
    }

    ngOnDestroy() {
      if (this.mqListener) {
        const mq = window.matchMedia('(max-width: 599px)');
        mq.removeEventListener('change', this.mqListener);
      }
    }

    private loadPersons(record: PnxDoc): Observable<PersonCardVM | null> {
      const lang = this.translate.currentLang;
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

        // filter for persons not rendered otb
        switchMap((persons: PersonVM[]) =>
          this.ethStoreService.linkedDataRecommendations$.pipe(
            map((entities) => {
              //console.error("entities",entities) 
              const entityIds = new Set(
                (entities ?? [])
                  .map((e: any) => e.id)
                  .filter((id: string | null | undefined): id is string => Boolean(id))
              );              
              //console.error("entityIds",entityIds)
              //console.error("persons",persons.map((e:any)=>e.wiki?.loc))
              const filteredPersons = persons.filter((person: any) => {
                const loc = person.wiki?.loc;
                //console.error("loc2",person.wiki?.loc)
                if (!loc) {
                  return true;
                }
                return !entityIds.has(loc);
              });
              return {
                otbPersons: entities,
                filteredPersons: filteredPersons
              }
            })
          )
        ),
        catchError(error => {
          this.ethErrorHandlingService.logError(error, 'EthPersonCardsComponent.loadPersons');
          return of(null);
        })
      )
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

    open(id: string) {
      this.openGnd = id;
    }
    close() {
      this.openGnd = null;
    }
    isOpen(gnd: string): boolean {
      return this.openGnd === gnd;
    }        

    navigate(url: string, event: Event){
      event.preventDefault(); 
      this.router.navigateByUrl(url);
    }    
}
