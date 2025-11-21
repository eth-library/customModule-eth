import { AfterViewInit, Component, inject, Inject, Input } from '@angular/core';
import { of, Observable, catchError, map, forkJoin, tap, switchMap } from 'rxjs';
import { EthMetagridService, Person } from './eth-metagrid.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import {TranslateModule} from "@ngx-translate/core";
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';


type FullDisplayState = {selectedRecordId:string};
type SearchParams = {q:string, tab:string, scope:string}
type SearchState = {searchParams: SearchParams, ids: string[], entities: Record<string, any>}
const selectFullDisplayState = createFeatureSelector<FullDisplayState>('full-display');
const selectFullDisplayRecordId = createSelector(selectFullDisplayState, state => state.selectedRecordId ?? null);
const selectSearchState = createFeatureSelector<SearchState>('Search');
const selectSearchEntities = createSelector(selectSearchState, state => state.entities);
const selectFullDisplayRecord = createSelector(selectFullDisplayRecordId,selectSearchEntities,(selectedId, entities) => selectedId ? entities[selectedId] : null);

@Component({
  selector: 'addon-eth-metagrid',
  templateUrl: './eth-metagrid.component.html',
  styleUrls: ['./eth-metagrid.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ]  
})

export class EthMetagridComponent implements AfterViewInit {
  private store = inject(Store);
  @Input() hostComponent: any = {};
  gndIds: string[] | null = [];
  persons$!: Observable<Person[]>;
  public moduleParametersDev: any = {};
  openedCards = new Set<string>();
  lang!: string | 'de';
  openLink$!: Observable<string>;
  closeLink$!: Observable<string>;
  newTab$!:  Observable<string>;
  

  constructor(
    @Inject('MODULE_PARAMETERS') public moduleParameters: any,
    private metagridService: EthMetagridService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document    
  ) {}


  ngAfterViewInit() {
    this.persons$ = this.store.select(selectFullDisplayRecord).pipe(
      switchMap(record => this.getPersons(record))
    )
  } 


  getPersons(record: any) {
    // [de,en,fr,it]
    this.moduleParametersDev = {
      "whitelist": [
        "sudoc",
        "hallernet",
        "fotostiftung",
        "sikart",
        "elites-suisses-au-xxe-siecle",
        "bsg",
        "dodis",
        "helveticat",
        "hls-dhs-dss",
        "histoirerurale",
        "lonsea",
        "ssrq",
        "alfred-escher",
        "geschichtedersozialensicherheit"
      ],
      "sudoc": ["Bibliographic Agency for Higher Education","Bibliographic Agency for Higher Education","Agence Bibliographique de l’Enseignement Supérieur", "Bibliographic Agency for Higher Education"],
      "hallernet": ["Editions- und Forschungsplattform hallerNet","Editions- und Forschungsplattform hallerNet","Editions- und Forschungsplattform hallerNet","Editions- und Forschungsplattform hallerNet"],
      "fotostiftung": ["Fotostiftung Schweiz","Fotostiftung Schweiz","Fotostiftung Schweiz","Fotostiftung Schweiz"],
      "sikart": ["SIKART","SIKART","SIKART","SIKART"],
      "elites-suisses-au-xxe-siecle": ["Schweizerische Eliten im 20. Jahrhundert",  "Swiss elites database","Elites suisses au XXe siècle","Elites suisses au XXe siècle"],
      "bsg": ["Bibliographie der Schweizergeschichte","Bibliography on Swiss History","Bibliographie de l'histoire suisse","Bibliografia della storia svizzera"],
      "dodis": ["Diplomatische Dokumente der Schweiz","Diplomatic Documents of Switzerland","Documents diplomatiques suisses","Documenti diplomatici svizzeri"],
      "helveticat": ["Helveticat","Helveticat","Helveticat","Helveticat"],
      "hls-dhs-dss": ["Historisches Lexikon der Schweiz","Historical Dictionary of Switzerland","Dictionnaire historique de la Suisse","Dizionario storico della Svizzera"],
      "histoirerurale": ["Archiv für Agrargeschichte","Archives of rural history","Archives de l'histoire rurale","Archivio della storia rurale"],
      "lonsea": ["Lonsea","Lonsea","Lonsea","Lonsea"],
      "ssrq": ["Sammlung Schweizerischer Rechtsquellen","Collection of Swiss Law Sources","Collection des sources du droit suisse","Collana Fonti del diritto svizzero"],
      "alfred-escher": ["Alfred Escher-Briefedition","Alfred Escher letters edition","Edition des lettres Alfred Escher","Edizione lettere Alfred Escher"],
      "geschichtedersozialensicherheit": ["Geschichte der sozialen Sicherheit","Geschichte der sozialen Sicherheit","Histoire de la sécurité sociale","Storia della sicurezza sociale svizzera"]
    }
    if(!this.moduleParameters || !this.moduleParameters.whitelist)this.moduleParameters = this.moduleParametersDev; 

    this.openLink$ = this.getI18nText('metagrid.link.open', {
      de: 'Metagrid-Links zeigen',
      en: 'Show Metagrid links',
      fr: '..',
      it: '..'
    });      

    this.closeLink$ = this.getI18nText('metagrid.close', {
      de: 'Metagrid-Links ausblenden',
      en: 'Hide Metagrid links'
    });      
    
    this.newTab$ = this.translate.get('nui.aria.newWindow');

    const gndIds = this.getGndIds(record);
    const gnd$ = gndIds?.length
      ? this.metagridService.getResourcesForGndIds(gndIds, this.moduleParameters?.whitelist).pipe(
          catchError(error => {
            console.error('error in Metagrid addon ngAfterViewInit() gnd:', error);
            return of([]);
          })
        )
      : of([]);

    const idRefs = this.getIdRefs(record);      
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
      tap(persons => setTimeout(() => this.copyMetagridLinks(persons), 1000))
    );
  
  }

  private getGndIds(record:any): string[] | null {
    const lds03 = record?.pnx?.display?.['lds03'] || [];
    const gndIds: string[] = lds03.map((l: any) => {
      l = l.replace('(DE-588)', '');
      // ALMA Ressources: link in value
      // http://d-nb.info/gnd/4113615-9\
      if (l.includes('http://d-nb.info/gnd')) {
        return l.substring(l.indexOf('gnd/') + 4, l.indexOf('">'));
      }
      // external data since dec 25
      else if (typeof l === 'string' && l.includes('GND: ')) {
        let value = l.slice(l.lastIndexOf(': ') + 2).trim();
        return value;
      }
      // external data (Prelog, Vladimir (rela): 119247496) todo until dec 25
      else if (typeof l === 'string' && l.includes(':') && !l.includes('idref.fr')) {
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
    const lds03 = record?.pnx?.display?.['lds03'] || [];
    return Array.from(
      new Set(
        lds03.map((entry: any) => {
          const match = entry.match(/idref\.fr\/([^">]+)/);
          return match?.[1] ?? null;
        }).filter((id: any): id is string => Boolean(id))
      )
    );
  }

  copyMetagridLinks(persons: Person[]): void {
    const personIdToTargetElementMap = new Map<string, Element>();

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
        personIdToTargetElementMap.set(personIdFromHref, selectorLink);
      });
    });

    // external data
    const spans = this.document.querySelectorAll('div[data-qa="detail_lds03"] span');
    spans.forEach(s => {
      if(s.innerHTML.lastIndexOf(':')>-1){
        const personIdFromSpan = s.innerHTML.substring(s.innerHTML.lastIndexOf(':')+1).replace('(DE-588)', '').trim();
        personIdToTargetElementMap.set(personIdFromSpan, s);
      }
    })    

    personIdsWithResources.forEach(personId => {
      if(personId){
          const link = this.document.getElementById('metagrid-link-' + personId);
          const card = this.document.getElementById('metagrid-card-' + personId)
          const target = personIdToTargetElementMap.get(personId)?.parentElement;
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
          const lang = this.translate.currentLang || 'de';
          return fallback[lang] ?? fallback['en'] ?? key;
        }
        return value;
      })
    );
  }

  getProviderLabel(slug: string): string {
    const lang = this.translate.currentLang || 'de';
    const langIndex = { de: 0, en: 1, fr: 2, it: 3 }[lang] ?? 0;
    let entry = this.moduleParameters?.[slug];
    if(!Array.isArray(entry)){
      entry = entry?.replace(/^\[|\]$/g, "").split(/\s*,\s*/) || null;
    }
    if (!entry || !entry[langIndex]) {
      return slug; 
    }
    return entry[langIndex];
  }

}
