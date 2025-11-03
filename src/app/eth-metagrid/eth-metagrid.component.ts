import { AfterViewInit, Component, inject, Inject, Input } from '@angular/core';
import { of, Observable, catchError, map, forkJoin, tap, switchMap } from 'rxjs';
import { EthMetagridService, Person } from './eth-metagrid.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';

type FullDisplayState = {selectedRecordId:string};
const selectFullDisplayState = createFeatureSelector<FullDisplayState>('full-display');
const selectFullDisplayRecordId = createSelector(selectFullDisplayState, state => state.selectedRecordId ?? null);

type SearchParams = {q:string, tab:string, scope:string}
type SearchState = {searchParams: SearchParams, ids: string[], entities: Record<string, any>}
const selectSearchState = createFeatureSelector<SearchState>('Search');
const selectSearchEntities = createSelector(selectSearchState, state => state.entities);

export const selectListviewRecord = (recordId: string) =>
  createSelector(
    selectSearchEntities,
    entities => entities[recordId] ?? null
  );

export const selectFullviewRecord = createSelector(
  selectFullDisplayRecordId,
  selectSearchEntities,
  (selectedId, entities) =>
    selectedId ? entities[selectedId] : null
);

@Component({
  selector: 'addon-eth-metagrid',
  templateUrl: './eth-metagrid.component.html',
  styleUrls: ['./eth-metagrid.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]  
})

export class EthMetagridComponent implements AfterViewInit {
  private store = inject(Store);
  @Input() hostComponent: any = {};
  gndIds: string[] | null = [];
  persons$!: Observable<Person[]>;
  public moduleParameters2: any = {};
  openedCards = new Set<string>();
  lang!: string | 'de';
  openLink$!: Observable<any>;
  closeLink$!: Observable<any>;
  
  constructor(
    @Inject('MODULE_PARAMETERS') public moduleParameters: any,
    private metagridService: EthMetagridService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document    
  ) {}

  ngAfterViewInit() {
    this.persons$ = this.getRecord$(this.hostComponent).pipe(
      switchMap(record => this.getPersons(record))
    )
  } 

  getPersons(record: any) {
    this.moduleParameters2 = {
      "whitelist": [
        "sudoc",
        "hallernet",
        "fotostiftung",
        "sikart",
        "elites-suisses-au-xxe-siecle",
        "bsg",
        "dodis",
        "helveticarchives",
        "helveticat",
        "hls-dhs-dss",
        "histoirerurale",
        "lonsea",
        "ssrq",
        "alfred-escher",
        "geschichtedersozialensicherheit"
      ],
      "translations": "{linkTextOpen={de=Metagrid-Links zeigen, en=Show Metagrid links}, linkTextClose={de=Metagrid-Links ausblenden, en=Hide Metagrid links}} ",
      "sudoc": "Editions- und Forschungsplattform hallerNet",
      "hallernet": "Editions- und Forschungsplattform hallerNet",
      "fotostiftung": "Fotostiftung Schweiz",
      "sikart": "SIKART",
      "elites-suisses-au-xxe-siecle": "Schweizerische Eliten im 20. Jahrhundert",
      "bsg": "Bibliographie der Schweizergeschichte",
      "dodis": "Diplomatische Dokumente der Schweiz",
      "helveticat": "Helveticat",
      "hls-dhs-dss": "Historisches Lexikon der Schweiz",
      "histoirerurale": "Archiv für Agrargeschichte",
      "lonsea": "Lonsea",
      "ssrq": "Sammlung Schweizerischer Rechtsquellen",
      "alfred-escher": "Alfred Escher-Briefedition",
      "geschichtedersozialensicherheit": "Geschichte der sozialen Sicherheit",
      "helveticarchives": "Helveticat"
    }
    if(!this.moduleParameters || !this.moduleParameters.whitelist)this.moduleParameters = this.moduleParameters2; 

    this.openLink$ = this.getI18nText('customizing.addon.metagrid.open', {
      de: 'Metagrid-Links zeigen',
      en: 'Show Metagrid links',
      fr: '..',
      it: '..'
    });      

    this.closeLink$ = this.getI18nText('item.not.exist.333', {
      de: 'Metagrid-Links ausblenden',
      en: 'Hide Metagrid links'
    });      
    
    const gndIdsLds03 = this.getGndIdsLds03(record);
    const gndIdsLds90 = this.getGndIdsLds90(record);
    const gndIds = Array.from(new Set([...(gndIdsLds03 ?? []), ...(gndIdsLds90 ?? [])]));
    const idRefs = this.getIdRefs(record);
    this.gndIds = gndIds;
    const gnd$ = gndIds?.length
      ? this.metagridService.getResourcesForGndIds(gndIds, this.moduleParameters?.whitelist).pipe(
          catchError(error => {
            console.error('error in Metagrid addon ngAfterViewInit() gnd:', error);
            return of([]);
          })
        )
      : of([]);

    const idRef$ = idRefs?.length
      ? this.metagridService.getResourcesForIdRefs(idRefs, this.moduleParameters?.whitelist).pipe(
          catchError(error => {
            console.error('error in Metagrid addon ngAfterViewInit() idref:', error);
            return of([]);
          })
        )
      : of([]);

    return forkJoin([gnd$, idRef$]).pipe(
      map(([gndPersons, idRefPersons]) => {
        const allPersons = [...gndPersons, ...idRefPersons].map(p => ({
          ...p,
          personId: p.gnd ?? p.idRef
        }));
        // const dedupedPersons = this.deduplicatePersons(allPersons);
        return allPersons;
      }),
      tap(persons => setTimeout(() => this.copyMetagridLinks(persons), 900))
    );
  
  }

  private getGndIdsLds03(record:any): string[] | null {
    const lds03 = record?.pnx?.display?.['lds03'] || [];
    const gndIds: string[] = lds03.map((l: any) => {
      l = l.replace('(DE-588)', '');
      // Alma
      if (l.includes('http://d-nb.info/gnd')) {
        return l.substring(l.indexOf('gnd/') + 4, l.indexOf('">'));
      }
      // external data (Prelog, Vladimir (rela): 119247496)
      else if (typeof l === 'string' && l.includes(':')) {
        const value = l.slice(l.lastIndexOf(':') + 1).trim();
        // not: "Frisch, Max : 1911-1991"
        if (/^\d+$/.test(value)) {
          return value;
        }
      }
      return null;
    }).filter(Boolean) as string[];
    return gndIds.length ? gndIds : null;
  }

  
  private getIdRefs(record:any): string[] | null {
    const lds90 = record?.pnx?.display?.['lds90'] || [];
    return Array.from(
      new Set(
        lds90.map((entry: any) => {
          const match = entry.match(/idref\.fr\/([^">]+)/);
          return match?.[1] ?? null;
        }).filter((id: any): id is string => Boolean(id))
      )
    );
  }

  private getGndIdsLds90(record:any): string[] {
    const lds90 = record?.pnx?.display?.['lds90'] || [];
    return Array.from(
      new Set(
        lds90.map((entry: any) => {
          const match = entry.match(/d-nb\.info\/gnd\/([^">]+)/);
          return match?.[1] ?? null;
        }).filter((id: any): id is string => Boolean(id))
      )
    );
  }

  copyMetagridLinks(persons: Person[]): void {
    const personIdToTargetElement = new Map<string, Element>();

    const personIdsWithResources = persons
      .filter(p => (p.resources?.length ?? 0) > 0)
      .map(p => p.personId!);

    // Alma data
    const linkConfigs = [
      { selector: 'a[href*="d-nb.info/gnd/"]', extractId: (href: string) => href.split('/').pop() },
      { selector: 'a[href*="www.idref.fr/"]', extractId: (href: string) => href.split('/').pop() }
    ];

    linkConfigs.forEach(({ selector, extractId }) => {
      const links = this.document.querySelectorAll(selector);
      links.forEach(selectorLink => {
        const href = selectorLink.getAttribute('href');
        const personIdFromHref = href ? extractId(href) : null;
        if (!personIdFromHref || !personIdsWithResources.includes(personIdFromHref)) return;
        personIdToTargetElement.set(personIdFromHref, selectorLink);
      });
    });

    // external data
    const spans = this.document.querySelectorAll('div[data-qa="detail_lds03"] span');
    spans.forEach(s => {
      if(s.innerHTML.lastIndexOf(':')>-1){
        const personIdFromSpan = s.innerHTML.substring(s.innerHTML.lastIndexOf(':')+1).replace('(DE-588)', '').trim();
        personIdToTargetElement.set(personIdFromSpan, s);
      }
    })    

    personIdsWithResources.forEach(personId => {
      if(personId){
          const link = this.document.getElementById('metagrid-link-' + personId);
          const card = this.document.getElementById('metagrid-card-' + personId)
          const target = personIdToTargetElement.get(personId);
          if (link && target?.parentNode) {
            target.parentNode.insertBefore(link, target.nextSibling);
            if (card) {
              target.parentNode.append(card);
            }
          }
      }
    })

  }

  toggleCard(personId: string, link: HTMLElement): void {
    const card = this.document.querySelector(`#metagrid-card-${personId}`) as HTMLElement;
    if (!card || !link) return;
    const isOpen = this.openedCards.has(personId);
    if (isOpen) {
      this.openedCards.delete(personId);
      card.style.display = 'none';
      link.setAttribute('aria-expanded', 'false');
    } else {
      this.openedCards.add(personId);
      card.style.display = 'block';
      link.setAttribute('aria-expanded', 'true');
    }
  }


  getI18nText(key: string, fallback: { [lang: string]: string }): Observable<string> {
    return this.translate.get(key).pipe(
      map(value => {
        if (value === key) {
          const lang = this.translate.currentLang || 'en';
          return fallback[lang] ?? fallback['en'] ?? key;
        }
        return value;
      })
    );
  }

  getRecord$(hostComponent: any) {
    const recordId = hostComponent?.searchResult?.pnx?.control?.recordid[0];
    return this.store.select(selectFullviewRecord).pipe(
      switchMap(record =>
        record
          ? of(record)
          : this.store.select(selectListviewRecord(recordId))
      )
    );
  }

}
