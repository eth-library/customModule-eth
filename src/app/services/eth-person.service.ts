import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EthErrorHandlingService } from './eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { PersonApiResponse, GndByIdRefApiResponse, WikiRelatedPersonApiResponse, PrometheusApiResponse, WikiApiResponse, MetagridApiResponse, MetagridResource, WikiArchivesAtLinksVM, MetagridLinksVM, EntityfactsApiResponse, EntityfactsRelatedPersonApiResponse, WikiArchivesAtApiResponse, PrimoApiResponse, WikiRelatedPersonVM, EntityfactsRelatedPersonVM, PersonVM, EntityfactsVM, ExternalLinkVM, WikiVM, WikiRelatedPersonBinding, WikiUrlListApiResponse } from '../models/eth.model';

@Injectable({
  providedIn: 'root'
})
export class EthPersonService {
    private tab?: string | null;
    private scope?: string | null;
    private vid?: string | null;
    private baseurlRIB = 'https://daas.library.ethz.ch/rib/v3';

    constructor(
        private http: HttpClient,
        private ethErrorHandlingService: EthErrorHandlingService,
        private translate: TranslateService,
    ) {}

   
    getPersons(gnds: string, lang: string): Observable<PersonApiResponse> {
        const url = `${this.baseurlRIB}/persons/person-gnd-short?gnd=${gnds}&lang=${lang}`;
        return this.http.get<PersonApiResponse>(url).pipe(
            catchError(e => {
                // no persons found
                if (e.status !== 500){
                    this.ethErrorHandlingService.logError(e, 'EthPersonService.getPersons');
                }
                return throwError(() => e);
            })
        );
    }
        
    getPerson(id: string, lang: string): Observable<PersonApiResponse> {
        if(id.startsWith('Q')){
            return this.getPersonByQid(id, lang)
        }
        if(id.startsWith('n')){
            return this.getPersonByLccn(id, lang)
        }
        else{
            return this.getPersonByGnd(id, lang);
        }
    }

    private getPersonByQid(qid: string, lang: string): Observable<PersonApiResponse> {
        const url = `${this.baseurlRIB}/persons/person-qid?qid=${qid}&lang=${lang}`;
        return this.http.get<PersonApiResponse>(url).pipe(
            catchError(e => {
                this.ethErrorHandlingService.logError(e, 'EthPersonService.getPersonByQid');
                return throwError(() => e);
            })      

        );
    }

    private getPersonByGnd(gnd: string, lang: string): Observable<PersonApiResponse> {
        const url = `${this.baseurlRIB}/persons/person-gnd?gnd=${gnd}&lang=${lang}`;
        return this.http.get<PersonApiResponse>(url).pipe(
            catchError(e => {
                this.ethErrorHandlingService.logError(e, 'EthPersonService.getPersonByGnd');
                return throwError(() => e);
            })      

        );
    }

    // https://daas.library.ethz.ch/rib/v3/persons/person-lccn?lccn=nr92018830&lang=en
    private getPersonByLccn(lccn: string, lang: string): Observable<PersonApiResponse> {
        const url = `${this.baseurlRIB}/persons/person-lccn?lccn=${lccn}&lang=${lang}`;
        return this.http.get<PersonApiResponse>(url).pipe(
            catchError(e => {
                this.ethErrorHandlingService.logError(e, 'EthPersonService.getPersonByLccn');
                return throwError(() => e);
            })      
  
        );
    }

    getGndByIdRef(idref: string): Observable<string | null>  {
        const url = `https://daas.library.ethz.ch/rib/v3/persons/gnd/sudoc/${idref}`;
        return this.http.get<GndByIdRefApiResponse>(url).pipe(
            map(response => response?.gnd ?? null),
            catchError(e => {
                if (e.status === 404) return of(null);
                return throwError(() => e);           
            })
        );
    }
 
    searchPrimoData(q: string, tab: string, scope: string, lang: string = 'de'): Observable<PrimoApiResponse> {
        const url = `${this.baseurlRIB}/search?lang=${lang}&limit=1&skipDelivery=true&disableSplitFacets=false&q=${encodeURIComponent(q)}`;
        return this.http.get<PrimoApiResponse>(url).pipe(
            catchError((e) => {
                this.ethErrorHandlingService.logError(e, 'EthPersonService.searchPrimoData');
                return throwError(() => e);           
            })
        );
    }

    private processPrometheusResponse(resp: PrometheusApiResponse): ExternalLinkVM[] {
        try {
            const sourcesWhitelist = [
            "ba.e-pics.ethz.ch","performing-arts.eu","deutsche-biographie.de","www.perlentaucher.de","archinform.net/gnd","www.gutenberg.org","archivdatenbank-online.ethz.ch/hsa/"];
            const links: ExternalLinkVM[] = [];
            let dbUsed = false;

            resp[3].forEach((url: string, idx: number) => {
                if (!sourcesWhitelist.some(s => url.includes(s))) return;

                if (url.includes("deutsche-biographie.de")) {
                    if (dbUsed) return;
                    dbUsed = true;
                }

                let label = resp[1][idx];
                if (url.includes("deutsche-biographie.de")) label = "Deutsche Biographie";
                else if (url.includes("ba.e-pics.ethz.ch")) label = this.getProviderLabel('e-pics');
                else if (url.includes("archivdatenbank-online.ethz.ch/hsa/")) label = this.getProviderLabel('hsa');
                else if (url.includes("www.gutenberg.org")) label = "Projekt Gutenberg";
                else if (url.includes("www.perlentaucher.de")) label = "perlentaucher.de";
                else if (url.includes("archinform.net")) label = this.getProviderLabel('archinform');

                links.push({ url, label });
            });
            return links;
        } catch (error) {
            this.ethErrorHandlingService.logSyncError(error, 'EthPersonService.processPrometheusResponse');
            return [];
        }
    }


    private processEntityfactsResponse(resp: EntityfactsApiResponse): EntityfactsVM | undefined {
        try {
            if (!resp || resp['@type'] !== 'person') return undefined;

            const ef: PersonVM['entityfacts'] = {
                relatedPersons: []
            };

            ef.preferredName = resp.preferredName;
            ef.biography = resp.biographicalOrHistoricalInformation;
            ef.profession = resp.professionOrOccupation?.[0]?.preferredName;
            ef.birthDate = resp.dateOfBirth;
            ef.deathDate = resp.dateOfDeath;
            ef.image = resp.depiction;

            if (resp.familialRelationship) ef.relatedPersons.push(...this.mapEntityfactsRelatedPersons(resp.familialRelationship));
            if (resp.relatedPerson) ef.relatedPersons.push(...this.mapEntityfactsRelatedPersons(resp.relatedPerson));
            if (resp.placeOfActivity) {
                ef.placesOfActivity = resp.placeOfActivity
                    .filter((p: any) => p['@id'])
                    .map((p: any) => ({
                        gnd: p['@id']?.split('/').pop(),
                        name: p.preferredName || ''
                    }));
            }
            if (resp.placeOfBirth) {
                ef.placesOfBirth = resp.placeOfBirth
                    .filter((p: any) => p['@id'])
                    .map((p: any) => ({
                        gnd: p['@id']?.split('/').pop(),
                        name: p.preferredName || ''
                    }));
            }
            if (resp.sameAs) {
                const match = resp.sameAs.find((s: any) => s.collection.abbr === 'LC');
                if (match) {
                    ef.lccn = match['@id']?.split('/').pop();
                }
            }
            if (resp.sameAs) {
                const match = resp.sameAs.find((s: any) => s.collection.abbr === 'WIKIDATA');
                if (match) {
                    ef.qid = match['@id']?.split('/').pop();
                }
            }
            return ef;
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error, 'EthPersonService.processEntityfactsResponse');
            return {relatedPersons:[]};
        }
    }

    private mapEntityfactsRelatedPersons(persons: EntityfactsRelatedPersonApiResponse[]): EntityfactsRelatedPersonVM[] {
        return persons.map(p => ({
            gnd: p['@id']?.split('/').pop() || '',
            name: p.preferredName || '',
            relationship: p.relationship || ''
        }));
    }


    private processWikiResponse(resp: WikiApiResponse): WikiVM | undefined {
        try {
            const binding = resp.results.bindings?.[0];
            if (!binding) return undefined;
            const wiki: WikiVM = {
                qid: binding.item?.value?.split('/').pop(),
                loc: binding.loc?.value,
                label: binding.itemLabel?.value,
                description: binding.itemDescription?.value,
                image_url: binding.image?.value,
                birth: binding.birth?.value,
                death: binding.death?.value,
                birthplace: binding.birthplaceLabel?.value,
                deathplace: binding.deathplaceLabel?.value,
                aVariants: binding.aliasList?.value?.split('|') ?? [],
                links: [],
                profiles: []
            };

            if (wiki.aVariants && wiki.label && !wiki.aVariants.includes(wiki.label)) {
                wiki.aVariants.unshift(wiki.label);
            }

            if (binding.item) wiki.links?.push({ url: binding.item.value, label: 'Wikidata' });
            if (binding.wc) wiki.links?.push({ url: 'https://commons.wikimedia.org/wiki/Category:' + binding.wc.value, label: 'Wikimedia Commons' });
            if (binding.hls) wiki.links?.push({ url: 'http://www.hls-dhs-dss.ch/textes/d/D' + binding.hls.value + '.php', label: this.getProviderLabel('hls-dhs-dss') });
            
            ['orcid','scholar','scopus','researchgate','dimension'].forEach(key => {
            if (binding[key]) wiki.profiles?.push({ url: this.mapProfileUrl(key, binding[key].value), label: this.capitalize(key) });
            });

            return wiki;
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error, 'EthPersonService.processWikiResponse');
            return undefined;
        }
    }

    private mapProfileUrl(key: string, value: string): string {
        switch(key){
            case 'orcid': return `https://orcid.org/${value}`;
            case 'scholar': return `https://scholar.google.com/citations?user=${value}`;
            case 'scopus': return `https://www.scopus.com/authid/detail.uri?authorId=${value}`;
            case 'researchgate': return `https://www.researchgate.net/profile/${value}`;
            case 'dimension': return `https://app.dimensions.ai/discover/publication?and_facet_researcher=ur.${value}`;
            default: return '';
        }
    }
    
    private capitalize(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    private processWikipediaUrlListResponse( resp: WikiUrlListApiResponse, lang: string): string | undefined {
        try {
            const urlsStr = resp.results.bindings?.[0]?.wikipediaUrlList?.value;
            if (!urlsStr) return undefined;
            const urls: string[] = urlsStr.split(';');

            const searchLangs = [lang + '.wikipedia.org', 'en.wikipedia.org', '.wikipedia.org'];
            for (const s of searchLangs) {
                const found = urls.find(u => u.includes(s));
                if (found) return found;
            }
            return undefined;
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error, 'EthPersonService.processWikipediaUrlListResponse');
            return undefined;
        }
    }


    private processRelatedPersonsResponse( resp: WikiRelatedPersonApiResponse ): WikiRelatedPersonVM[] {
        try {
            const bindings: WikiRelatedPersonBinding[] = resp.results?.bindings ?? [];
            let lastItem = '';
            return bindings
                .filter((b) => {
                    const itemValue = b.item?.value;
                    const labelValue = b.itemLabel?.value ?? '';

                    if (!itemValue) return false;

                    return itemValue !== lastItem && !itemValue.includes(labelValue);
                })
                .map((b) => {
                    const itemValue = b.item!.value; 
                    lastItem = itemValue;
                    return {
                        qid: itemValue.split('/').pop(),
                        name: b.itemLabel?.value ?? '',
                        gnd: b.gndId?.value ?? '',
                        image_url: b.image?.value,
                        description: b.itemDescription?.value,
                        birth: b.teacherBirths?.value ?? b.studentBirths?.value,
                    };
                });
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error,'EthPersonService.processRelatedPersonsResponse');
            return [];
        }
    }


    private processWikiArchivesAtResponse( resp: WikiArchivesAtApiResponse): WikiArchivesAtLinksVM[] {
        try {
            return resp.results.bindings
                .filter(b => !!b.ref?.value) 
                .map(b => ({
                    url: b.ref!.value,                         
                    label: b.archivedLabel?.value ?? 'Archives',
                    inventoryno: b.inventoryno?.value
                }));
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error,'EthPersonService.processWikiArchivesAtResponse');
            return [];
        }
    }



    private processMetagridResponse(resp: MetagridApiResponse): MetagridLinksVM[] {
        try {
            const whitelist = ["dodis","hls-dhs-dss","sudoc","hallernet","fotostiftung","sikart"];
            const resources = resp.concordances?.[0]?.resources ?? [];
            const links: MetagridLinksVM[] = [];
            resources.forEach((r: MetagridResource) => {
                if (!whitelist.includes(r.provider.slug)) return;
                links.push({ url: r.link.uri, label: this.getProviderLabel(r.provider.slug), slug: r.provider.slug });
            });

            // Dodis + HLS first
            const sorted = [
            ...links.filter(l => l.slug === 'dodis'),
            ...links.filter(l => l.slug === 'hls-dhs-dss'),
            ...links.filter(l => !['dodis','hls-dhs-dss'].includes(l.slug!))
            ];
            return sorted;
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error, 'EthPersonService.processMetagridResponse');
            return [];
        }
    }


    processPersonsResponse(resp: PersonApiResponse, lang: string): PersonVM  {
        try {
            if (!lang) lang = 'de';
            const results = resp.results;
            const person: PersonVM = {
                gnd: '',
                name: '',
                url: '',
                entityfacts: undefined,
                metagridLinks: [],
                prometheusLinks: [],
                teachers: [],
                students: [],
                wikipediaUrl: undefined,
                wiki: undefined,
                wikiArchivesAtLinks: []
            };

            // GND
            const resultWithGnd = results.filter(r => r.gnd && r.gnd !== '');
            if (resultWithGnd.length > 0) {
                person.gnd = resultWithGnd[0].gnd!;
            }

            // Entityfacts
            const entityfactsResult = results.filter(r => r.provider === 'hub.culturegraph.org');
            if (entityfactsResult.length > 0) {
                person.entityfacts = this.processEntityfactsResponse(entityfactsResult[0].resp);
            }

            // Metagrid
            const metagridResult = results.filter(r => r.provider === 'api.metagrid.ch');
            if (metagridResult.length > 0 && metagridResult[0].resp.concordances?.length > 0) {
                person.metagridLinks = this.processMetagridResponse(metagridResult[0].resp);
            }

            // Prometheus
            const prometheusResult = results.filter(r => r.provider === 'prometheus.lmu.de');
            if (prometheusResult.length > 0) {
                person.prometheusLinks = this.processPrometheusResponse(prometheusResult[0].resp);
            }

            // Related persons (teachers)
            const wikiTeacherResult = results.filter(
                r => r.provider === 'query.wikidata.org' && r.resp.head.vars.includes('teacherBirths')
            );
            if (wikiTeacherResult.length > 0) {
                person.teachers = this.processRelatedPersonsResponse(wikiTeacherResult[0].resp);
            }

            // Related persons (students)
            const wikiStudentResult = results.filter(
                r => r.provider === 'query.wikidata.org' && r.resp.head.vars.includes('studentBirths')
            );
            if (wikiStudentResult.length > 0) {
                person.students = this.processRelatedPersonsResponse(wikiStudentResult[0].resp);
            }

            // Wikipedia URL
            const wikiWikipediaUrlListResult = results.filter(
                r => r.provider === 'query.wikidata.org' && r.resp.head.vars.includes('wikipediaUrlList')
            );
            if (wikiWikipediaUrlListResult.length > 0) {
                person.wikipediaUrl = this.processWikipediaUrlListResponse(wikiWikipediaUrlListResult[0].resp, lang);
            }

            // Wikidata bio + links
            const wikiResult = results.filter(
            r => r.provider === 'query.wikidata.org' && r.resp.head.vars.includes('birth')
            );
            if (wikiResult.length > 0) {
                person.wiki = this.processWikiResponse(wikiResult[0].resp);
            }

            // Wikidata archives at
            const wikiArchivesAtResult = results.filter(
                r => r.provider === 'query.wikidata.org' && r.resp.head.vars.includes('refnode')
            );
            if (wikiArchivesAtResult.length > 0) {
                person.wikiArchivesAtLinks = this.processWikiArchivesAtResponse(wikiArchivesAtResult[0].resp);
            }

            // URL der Entity
            if (person.wiki?.loc) {
                person.url = `/entity/person?entityId=${person.wiki.loc}&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=${lang}`;
            } else if (person.entityfacts?.lccn) {
                person.url = `/entity/person?entityId=${person.entityfacts.lccn}&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=${lang}`;
            } else if (person.gnd) {
                person.url = `/entity/person?entityId=${person.gnd}&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=${lang}`;
            }

            // Name
            person.name = person.entityfacts?.preferredName ?? person.wiki?.label ?? '';

            // qid
            person.qid = person.wiki?.qid ?? person.entityfacts?.qid ?? '';
            
            return person;
        } catch (error: unknown) {
            this.ethErrorHandlingService.logSyncError(error, 'EthPersonService.processPersonsResponse');
            return {gnd: '', url: ''}
        }
    }

    getPersonPageUrl(identifier:string): string{
        let url = `/entity/person?entityId=${identifier}&vid=41SLSP_ETH:ETH_CUSTOMIZING`;
        return url;
    }

    getPlacePageLink(identifier:string): string{
        let query = '[wd/place]' + identifier;
        let url = `/nde/search?query=${query}&tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}`;
        return url;
    }

    getProviderLabel(slug: string): string {
        const providerLabel: Record<string, [string, string, string, string]> = {
        "e-pics": ["Bilder im E-Pics Bildarchiv","E-Pics Image Archive","E-Pics Image Archive","E-Pics Image Archive"],
        "hsa": ["Hochschularchiv der ETH Zürich","ETH Zurich University Archives","ETH Zurich University Archives","ETH Zurich University Archives"],
        "archinform": ["Architekturdatenbank archINFORM","Architecture Database archINFORM","Architecture Database archINFORM","Architecture Database archINFORM"],
        "gnd": ["Gemeinsame Normdatei (GND)","Integrated authority file (GND)","Integrated authority file (GND)", "Integrated authority file (GND)"],
        "swiss-archives": ["Schweizerisches Bundesarchiv","Swiss Federal Archives","Archives fédérales suisses", "Archivio federale svizzero"],
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
        const lang = this.translate.currentLang || 'de';
        const langIndex = { de: 0, en: 1, fr: 2, it: 3 }[lang] ?? 0;
        return providerLabel[slug]?.[langIndex] ?? slug;  
    }
}