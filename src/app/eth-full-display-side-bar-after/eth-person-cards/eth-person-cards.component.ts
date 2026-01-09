// Person cards based on GND ID or IdRef in the right sidebar 
// https://jira.ethz.ch/browse/SLSP-2095

import { Component, inject, Input } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, switchMap, tap } from 'rxjs';
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
import { HostComponent } from '../../models/eth.model';

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
    persons$!: Observable<any | null>; 
    @Input() hostComponent: HostComponent = {};
    private mqListener: ((e: MediaQueryListEvent) => void) | null = null;    
    private cardPositioned = false;
    
    constructor(
      private translate: TranslateService,
      public ethPersonService: EthPersonService,
      private ethErrorHandlingService: EthErrorHandlingService,
      private ethStoreService:EthStoreService,    
      private ethUtilsService: EthUtilsService,
      private matomoService: EthMatomoService                    
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
          return of({});      
        })

      )
    }

    ngOnDestroy() {
      if (this.mqListener) {
        const mq = window.matchMedia('(max-width: 599px)');
        mq.removeEventListener('change', this.mqListener);
      }
    }

    private loadPersons(record: PnxDoc): Observable<any | null> {
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
            return of([]);
          }
          return this.ethPersonService.getPersons(allGnds, lang);
        }),

        // normalize response
        map((response: any) => {
          if (!response?.gnd?.length) return [];
    
          const groupedResults = response.results.reduce((acc: Record<string, any[]>, person: any) => {
            if (person.gnd) {
              (acc[person.gnd] ||= []).push(person);
            }
            return acc;
          }, {});
    
          return response.gnd
            .map((gnd: string) => groupedResults[gnd]
              ? this.ethPersonService.processPersonsResponse(groupedResults[gnd], lang)
              : null
            )
            .filter(Boolean)
            .filter((person: any) => person.entityfacts?.preferredName || person.wiki?.label);             
        }),

        // filter for persons not rendered otb
        switchMap((persons) =>
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
              //console.error("filteredPersons",filteredPersons)
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
      return lds03.map(l => {
        l = l.replace('(DE-588)', '');
        if (l.includes('http://d-nb.info/gnd')) {
          return l.substring(l.indexOf('gnd/') + 4, l.indexOf('">'));
        } else if (l.includes(':')) {
          return l.split(':')[1].trim();
        }
        return null;
      }).filter((id): id is string => Boolean(id));
    }

    private getIdRefs(record: PnxDoc): string[] {
      const lds90 = record?.pnx?.display?.['lds90'] ?? [];
      return Array.from(
        new Set(
          lds90.map(entry => {
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
    isOpen(gnd: string) {
      return this.openGnd === gnd;
    }        

    navigate(url: string, event: Event){
      event.preventDefault(); 
      this.router.navigateByUrl(url);
    }    
}
