import { Component, DestroyRef, inject, Inject, Input } from '@angular/core';
import { of, Observable, catchError, map, forkJoin, tap, switchMap, defer } from 'rxjs';
import { EthMetagridService, Person } from './eth-metagrid.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { createFeatureSelector, createSelector, Store } from '@ngrx/store';

// get data from app store
type FullDisplayState = {selectedRecordId:string};
type SearchParams = {q:string, tab:string, scope:string}
type SearchState = {searchParams: SearchParams, ids: string[], entities: Record<string, any>}
const selectFullDisplayState = createFeatureSelector<FullDisplayState>('full-display');
const selectFullDisplayRecordId = createSelector(selectFullDisplayState, state => state.selectedRecordId ?? null);
const selectSearchState = createFeatureSelector<SearchState>('Search');
const selectSearchEntities = createSelector(selectSearchState, state => state.entities);
const selectFullDisplayRecord = createSelector(selectFullDisplayRecordId,selectSearchEntities,(selectedId, entities) => selectedId ? entities[selectedId] : null);

// constants
const METAGRID_MODULE_PARAMS_DEV = {
  whitelist: [
    'sudoc',
    'hallernet',
    'fotostiftung',
    'sikart',
    'elites-suisses-au-xxe-siecle',
    'bsg',
    'dodis',
    'helveticat',
    'hls-dhs-dss',
    'histoirerurale',
    'lonsea',
    'ssrq',
    'alfred-escher',
    'geschichtedersozialensicherheit'
  ],
  sudoc: ['Bibliographic Agency for Higher Education','Bibliographic Agency for Higher Education','Agence Bibliographique de l’Enseignement Supérieur', 'Bibliographic Agency for Higher Education'],
  hallernet: ['Editions- und Forschungsplattform hallerNet','Editions- und Forschungsplattform hallerNet','Editions- und Forschungsplattform hallerNet','Editions- und Forschungsplattform hallerNet'],
  fotostiftung: ['Fotostiftung Schweiz','Fotostiftung Schweiz','Fotostiftung Schweiz','Fotostiftung Schweiz'],
  sikart: ['SIKART','SIKART','SIKART','SIKART'],
  'elites-suisses-au-xxe-siecle': ['Schweizerische Eliten im 20. Jahrhundert',  'Swiss elites database','Elites suisses au XXe siècle','Elites suisses au XXe siècle'],
  bsg: ['Bibliographie der Schweizergeschichte','Bibliography on Swiss History','Bibliographie de l\'histoire suisse','Bibliografia della storia svizzera'],
  dodis: ['Diplomatische Dokumente der Schweiz','Diplomatic Documents of Switzerland','Documents diplomatiques suisses','Documenti diplomatici svizzeri'],
  helveticat: ['Helveticat','Helveticat','Helveticat','Helveticat'],
  'hls-dhs-dss': ['Historisches Lexikon der Schweiz','Historical Dictionary of Switzerland','Dictionnaire historique de la Suisse','Dizionario storico della Svizzera'],
  histoirerurale: ['Archiv für Agrargeschichte','Archives of rural history','Archives de l\'histoire rurale','Archivio della storia rurale'],
  lonsea: ['Lonsea','Lonsea','Lonsea','Lonsea'],
  ssrq: ['Sammlung Schweizerischer Rechtsquellen','Collection of Swiss Law Sources','Collection des sources du droit suisse','Collana Fonti del diritto svizzero'],
  'alfred-escher': ['Alfred Escher-Briefedition','Alfred Escher letters edition','Edition des lettres Alfred Escher','Edizione lettere Alfred Escher'],
  geschichtedersozialensicherheit: ['Geschichte der sozialen Sicherheit','Geschichte der sozialen Sicherheit','Histoire de la sécurité sociale','Storia della sicurezza sociale svizzera']
} as const;

// interface
interface PnxDoc  {
  pnx?: {
    display?: {
      lds03?: string[];
    };
  }
}

@Component({
  selector: 'addon-eth-metagrid',
  templateUrl: './eth-metagrid.component.html',
  styleUrls: ['./eth-metagrid.component.scss'],
  standalone: true,
  imports: [
    CommonModule
  ]  
})

export class EthMetagridComponent {
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  private detailsObserver?: MutationObserver;
    
  persons$: Observable<Person[]> = defer(() =>
    this.store
      .select(selectFullDisplayRecord)
      .pipe(switchMap(record => this.getPersons(record)))
  );
  
  openedCards = new Set<string>();
  
  openLinkText$: Observable<string> = this.getI18nText('metagrid.link.open', {
    de: 'Metagrid-Links zeigen',
    en: 'Show Metagrid links',
    fr: '..',
    it: '..'
  });
  
  closeLinkText$: Observable<string> = this.getI18nText('metagrid.close', {
    de: 'Metagrid-Links ausblenden',
    en: 'Hide Metagrid links'
  });
  
  newTabText$: Observable<string> = this.translate.stream('nui.aria.newWindow');
  

  constructor(
    @Inject('MODULE_PARAMETERS') public moduleParameters: any,
    private metagridService: EthMetagridService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document    
  ) {
    this.destroyRef.onDestroy(() => this.disconnectDetailsObserver());
  }

  getPersons(record: PnxDoc | null) {
    // fallback of config for local development
    if (!this.moduleParameters || !this.moduleParameters.whitelist) {
      this.moduleParameters = METAGRID_MODULE_PARAMS_DEV;
    }

    // extract GND from data and request metagrid service
    const gndIds = this.getGndIds(record);
    const gndPersons$ = gndIds?.length
      ? this.metagridService.getResourcesForGndIds(gndIds, this.moduleParameters?.whitelist).pipe(
          catchError(error => {
            console.error('EthMetagridComponent.getPersons() gnd', error);
            return of([]);
          })
        )
      : of([]);

    // extract idRef from data and request metagrid service
    const idRefs = this.getIdRefs(record);      
    const idRefPersons$ = idRefs?.length
      ? this.metagridService.getResourcesForIdRefs(idRefs, this.moduleParameters?.whitelist).pipe(
          catchError(error => {
            console.error('EthMetagridComponent.getPersons() idref', error);
            return of([]);
          })
        )
      : of([]);

    return forkJoin([gndPersons$, idRefPersons$]).pipe(
      // join persons and resources from responses    
      map(([gndPersons, idRefPersons]) => {
        const allPersons = [...gndPersons, ...idRefPersons]
          // filter for persons with ressources
          .filter(p => p.id !== null)
          .filter(p => (p.resources?.length ?? 0) > 0)
          .map(p => ({
            ...p,
            personId: p.gnd ?? p.idRef
          }));
        return allPersons;
      }),
      // copy toggle links and cards to target place
      tap(persons => this.observeDetailsContainer(persons))
    );
  
  }

  private observeDetailsContainer(persons: Person[]): void {
    this.disconnectDetailsObserver();

    const detailsContainer = this.document.querySelector('nde-full-display-details') as HTMLElement | null;
    if (!detailsContainer) return;

    this.detailsObserver = new MutationObserver((_mutations, observer) => {
      const authorityContainer = detailsContainer.querySelector('[data-qa="detail_lds03"]') as HTMLElement | null;
      const metagridCard = detailsContainer.querySelector('.metagrid-card') as HTMLElement | null;
      const metagridLink = detailsContainer.querySelector('.metagrid-link') as HTMLElement | null;

      if (authorityContainer && metagridCard && metagridLink) {
        this.copyMetagridLinks(persons, authorityContainer);
        observer.disconnect();
        this.detailsObserver = undefined;
      }
    });

    this.detailsObserver.observe(detailsContainer, { childList: true, subtree: true });
  }

  private disconnectDetailsObserver(): void {
    this.detailsObserver?.disconnect();
    this.detailsObserver = undefined;
  }

  
  // extract GND 
  private getGndIds(record: PnxDoc | null): string[] | null {
    const lds03 = record?.pnx?.display?.['lds03'] || [];
    const gndIds: string[] = lds03.map((l: any) => {
      l = l.replace('(DE-588)', '');
      // ALMA Ressources (local data): link in value
      // https://explore.gnd.network/gnd/118527908
      if (l.includes('/gnd/')) {
        return l.substring(l.indexOf('/gnd/') + 5, l.indexOf('">'));
      }
      // external data sources 
      // GND: Prelog, Vladimir (rela): 119247496
      else if (typeof l === 'string' && l.includes('GND: ')) {
        let value = l.slice(l.lastIndexOf(': ') + 2).trim();
        return value;
      }
      return null;
    }).filter(Boolean) as string[];
    return gndIds.length ? gndIds : null;
  }


  // extract idRef
  private getIdRefs(record: PnxDoc | null): string[] | null {
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
  
  
  // copy toggle links and cards to target place
  copyMetagridLinks(persons: Person[], authorityContainer: HTMLElement): void {
    // create map:  person to target element
    const personIdToTargetElementMap = new Map<string, Element>();

    // personsIds
    const personIds = persons
      .map(p => p.personId!);

    // Alma links in dom
    const links = authorityContainer.querySelectorAll<HTMLAnchorElement>('a[href]:not(.metagrid-link)');   

    const extractId = (href: string): string | null => {
      try {
        const url = new URL(href);
        return url.pathname.split('/').filter(Boolean).pop() ?? null;
      } catch {
        return null; 
      }
    };

    links.forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (
        href.includes('explore.gnd.network/gnd/') ||
        href.includes('d-nb.info/gnd/') ||
        href.includes('www.idref.fr/')
      ) {
        const personIdFromHref = extractId(href);
        if (!personIdFromHref) return;

        if (!personIdFromHref || !personIds.includes(personIdFromHref)) return;
        const span = link.parentElement;
        if(span){
          personIdToTargetElementMap.set(personIdFromHref, span);
        }
      }
    });

    // external data in dom
    const spans = authorityContainer.querySelectorAll('span');
    spans.forEach(s => {
      if(s.innerHTML.indexOf('<a') === -1 && s.innerHTML.indexOf('GND:') > -1 && s.innerHTML.lastIndexOf(':') > -1){
        const personIdFromSpan = s.innerHTML.substring(s.innerHTML.lastIndexOf(':')+1).replace('(DE-588)', '').trim();
        personIdToTargetElementMap.set(personIdFromSpan, s);
      }
    })    
    // copy link and card
    personIds.forEach(personId => {
      if(personId){
          const link = this.document.getElementById('metagrid-link-' + personId);
          const card = this.document.getElementById('metagrid-card-' + personId)
          const target = personIdToTargetElementMap.get(personId);
          if (link && target?.parentElement) {
            target.parentElement.insertBefore(link, target.nextSibling);
            if (card) {
              target.parentElement.append(card);
            }
          }
      }
    })

  }

  
  // open and close card
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
    return this.translate.stream(key).pipe(
      map(value => {
        if (value === key) {
          const lang = this.translate.currentLang || 'de';
          return fallback[lang] ?? fallback['en'] ?? key;
        }
        return value;
      })
    );
  }

  // get provider label from moduleParameters config
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
