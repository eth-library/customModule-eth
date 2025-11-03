import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { EthErrorHandlingService } from './eth-error-handling.service';


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
    ) {}

    getPersons(gnds:string, lang:string): Observable<any> {
        return this.http.get('https://daas.library.ethz.ch/rib/v3/persons/person-gnd?gnd=' + gnds + '&lang=' + lang).pipe(
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPersonService.getPersons'))
        )
    }
        
    getPerson(id: string, lang: string): Observable<any> {
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

    private getPersonByQid(qid: string, lang: string): Observable<any> {
        const url = `${this.baseurlRIB}/persons/person-qid?qid=${qid}&lang=${lang}`;
        return this.http.get(url).pipe(
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPersonService.getPersonByQid'))     
        );
    }

    private getPersonByGnd(gnd: string, lang: string): Observable<any> {
        const url = `${this.baseurlRIB}/persons/person-gnd?gnd=${gnd}&lang=${lang}`;
        return this.http.get(url).pipe(
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPersonService.getPersonByGnd'))    
        );
    }

    // https://daas.library.ethz.ch/rib/v3/persons/person-lccn?lccn=nr92018830&lang=en
    private getPersonByLccn(lccn: string, lang: string): Observable<any> {
        const url = `${this.baseurlRIB}/persons/person-lccn?lccn=${lccn}&lang=${lang}`;
        return this.http.get(url).pipe(
            catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthPersonService.getPersonByGnd'))    
        );
    }

    getGndByIdRef(idref: string) {
        const url = `https://daas.library.ethz.ch/rib/v3/persons/gnd/sudoc/${idref}`;
        
        return this.http.get<{ gnd?: string; errorMessage?: string }>(url).pipe(
          map(response => response?.gnd ?? null),
          catchError(httpError => {
            if (httpError.status === 404) return of(null);
            
            let error = `***ETH*** An error occurred: EthPersonCardService.getGndByIdRef: ${httpError.status}`;
            if (httpError.error?.errorMessage) {
              error += ` - ${httpError.error.errorMessage}`;
            }
            console.error(error);
            return of(null);
          })
        );
    }
 
    searchPrimoData(q: string, tab: string, scope: string, lang: string = 'de'): Observable<any> {
        const url = `${this.baseurlRIB}/search?lang=${lang}&limit=1&skipDelivery=true&disableSplitFacets=false&q=${encodeURIComponent(q)}`;
        return this.http.get(url).pipe(
            catchError((error) => {
                this.ethErrorHandlingService.handleError(error, 'EthPersonService.searchPrimoData');
                return of(null);
            })
    
        );
    }

    private processPrometheusResponse(prometheusResult: any): any{
        try{
            let sourcesWhitelist = ["ba.e-pics.ethz.ch","performing-arts.eu",
                                    "/www.historische-kommission-muenchen-editionen.de/beacond/filmportal.php",
                                    "deutsche-biographie.de", "deutsche-digitale-bibliothek.de",
                                    "www.hdg.de/lemo/html/biografien/", "www.perlentaucher.de/autor/","archinform.net/gnd/",
                                    "www.gutenberg.org/ebooks/author/","archivdatenbank-online.ethz.ch/hsa/","geschichtsquellen.de"
                                    ];
            let whitelistedPrometheusLinks = [];
            let isDB = false;
            for(var j = 0; j < prometheusResult[0].resp[1].length; j++){
                let isWhitelisted = false;
                let url = prometheusResult[0].resp[3][j];
                // Für NDB und ADB nur einen Link
                if (url.indexOf("http://www.deutsche-biographie.de")>-1){
                    if(!isDB){
                        isDB = true;
                    }
                    else{
                        continue;
                    }
                }

                for(var k=0;k<sourcesWhitelist.length;k++){
                    if(url.indexOf(sourcesWhitelist[k])>-1)
                        isWhitelisted = true;
                }
                if (!isWhitelisted)
                        continue;
                let label = prometheusResult[0].resp[1][j];
                if (url.indexOf("deutsche-biographie.de")>-1) {
                        label = "Deutsche Biographie";
                }
                else if (url.indexOf("ba.e-pics.ethz.ch")>-1) {
                        label = "Bilder im E-Pics Bildarchiv";
                }
                else if (url.indexOf("archivdatenbank-online.ethz.ch/hsa/")>-1) {
                    label = "ETH Hochschularchiv";
                }
                else if (url.indexOf("www.gutenberg.org")>-1) {
                        label = "Projekt Gutenberg";
                }
                else if (url.indexOf("www.perlentaucher.de")>-1) {
                        label = "perlentaucher.de";
                }
                else if (url.indexOf("www.hdg.de")>-1) {
                        label = "LeMO Biographie";
                }
                else if (url.indexOf("archinform.net")>-1) {
                        label = "Architekturdatenbank archINFORM";
                }
                whitelistedPrometheusLinks.push({'url': url, 'label': label});
            }
            if(whitelistedPrometheusLinks.length > 0 && prometheusResult[0].gnd){
                whitelistedPrometheusLinks.push({'url': 'https://prometheus.lmu.de/gnd/' + prometheusResult[0].gnd , 'label': 'Alle Links von Prometheus'});
            }
            return whitelistedPrometheusLinks;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processPrometheusResponse');
        }
    }

    private processEntityfactsResponse(entityfactsResult: any){
        try{
            let entityfacts: Record<string, any> = {};
            entityfacts['relatedPersons'] = [];
            if (entityfactsResult[0].resp['@type'] !== 'person')return null;
            if(entityfactsResult[0].resp.preferredName)entityfacts['preferredName'] = entityfactsResult[0].resp.preferredName;
            if(entityfactsResult[0].resp.biographicalOrHistoricalInformation)entityfacts['biographicalOrHistoricalInformation'] = entityfactsResult[0].resp.biographicalOrHistoricalInformation;
            if(entityfactsResult[0].resp.professionOrOccupation)entityfacts['professionOrOccupation'] = entityfactsResult[0].resp.professionOrOccupation[0].preferredName;
            if(entityfactsResult[0].resp.dateOfBirth)entityfacts['dateOfBirth'] = entityfactsResult[0].resp.dateOfBirth;
            if(entityfactsResult[0].resp.dateOfDeath)entityfacts['dateOfDeath'] = entityfactsResult[0].resp.dateOfDeath;
            if(entityfactsResult[0].resp.depiction)entityfacts['depiction'] = entityfactsResult[0].resp.depiction;
            if(entityfactsResult[0].resp.familialRelationship)entityfacts['relatedPersons'] = entityfacts['relatedPersons'].concat(entityfactsResult[0].resp.familialRelationship);
            if(entityfactsResult[0].resp.relatedPerson)entityfacts['relatedPersons'] = entityfacts['relatedPersons'].concat(entityfactsResult[0].resp.relatedPerson);
            entityfacts['relatedPersons'] = entityfacts['relatedPersons'].map((p:any) => {
                if(p['@id'])
                    p.gnd = p['@id'].substring(p['@id'].lastIndexOf('/')+1);
                else
                    p.gnd = null;
                return p;
            })
            entityfacts['relatedPersons'] = entityfacts['relatedPersons'].filter((p:any) => {
                if(p.preferredName.indexOf('Familie')>-1)return false;
                return p.gnd;
            })
            
            if(entityfactsResult[0].resp.placeOfBirth){
                entityfacts['placeOfBirth'] = entityfactsResult[0].resp.placeOfBirth[0];
                if(entityfactsResult[0].resp.placeOfBirth[0]['@id'])
                    entityfacts['placeOfBirth'].gnd = entityfactsResult[0].resp.placeOfBirth[0]['@id'].substring(entityfactsResult[0].resp.placeOfBirth[0]['@id'].lastIndexOf('/')+1);
            }
            if(entityfactsResult[0].resp.placeOfDeath){
                entityfacts['placeOfDeath'] = entityfactsResult[0].resp.placeOfDeath[0];
                if(entityfactsResult[0].resp.placeOfDeath[0]['@id'])
                    entityfacts['placeOfDeath'].gnd = entityfactsResult[0].resp.placeOfDeath[0]['@id'].substring(entityfactsResult[0].resp.placeOfDeath[0]['@id'].lastIndexOf('/')+1);
            }
            if(entityfactsResult[0].resp.placeOfActivity){
                entityfacts['placeOfActivity'] = [];
                entityfactsResult[0].resp.placeOfActivity.forEach( (p:any) => {
                    if(p['@id']){
                        p.gnd = p['@id'].substring(p['@id'].lastIndexOf('/')+1);
                        entityfacts['placeOfActivity'].push(p)
                    }
                });
            }
            return entityfacts;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processEntityfactsResponse');        
        }
    }

    private processWikiResponse(wikiResult: any, lang: any){
        try{
            if(!wikiResult[0] || !wikiResult[0].resp.results.bindings || wikiResult[0].resp.results.bindings.length === 0){
                return;
            }
            let wiki: Record<string, any> = {};
            let binding = wikiResult[0].resp.results.bindings[0];
            wiki['qid'] = binding.item ? binding.item.value.substring(binding.item.value.lastIndexOf('/')+1) : null;
            wiki['loc'] = binding.loc ? binding.loc.value : null;
            wiki['label'] = binding.itemLabel ? binding.itemLabel.value : null;
            wiki['image_url'] = binding.image ? binding.image.value : null;
            wiki['description'] = binding.itemDescription ? binding.itemDescription.value : null;
            wiki['gnd'] = binding.gnd ? binding.gnd.value : null;
            wiki['birth'] = binding.birth ? binding.birth.value : null;
            wiki['death'] = binding.death ? binding.death.value : null;
            wiki['birthplace'] = binding.birthplaceLabel ? binding.birthplaceLabel.value : null;
            wiki['deathplace'] = binding.deathplaceLabel ? binding.deathplaceLabel.value : null;
            wiki['aVariants'] = binding.aliasList ? binding.aliasList.value.split('|') : null;
            if(wiki['aVariants'] && wiki['aVariants'].indexOf(wiki['label']) === -1){
                wiki['aVariants'].unshift(wiki['label']);
            }
            wiki['links'] = [];
            if(binding.item && binding.item.value)wiki['links'].push({'url': binding.item.value, 'label': 'Wikidata'});
            if(binding.wc && binding.wc.value)wiki['links'].push({'url': 'https://commons.wikimedia.org/wiki/Category:' + binding.wc.value , 'label': 'Wikimedia Commons'});
            if(binding.hls && binding.hls.value)wiki['links'].push({'url': 'http://www.hls-dhs-dss.ch/textes/d/D' + binding.hls.value + '.php', 'label': 'Historisches Lexikon der Schweiz'});
            if(binding.oclc && binding.oclc.value)wiki['links'].push({'url': 'https://entities.oclc.org/worldcat/entity/' + binding.oclc.value, 'label': 'WorldCat'});
            if(binding.ah && binding.ah.value)wiki['links'].push({'url': 'https://katalog.arthistoricum.net/id/' + binding.ah.value, 'label': 'arthistoricum.net'});
            if(binding.kal && binding.kal.value)wiki['links'].push({'url': 'https://kalliope-verbund.info/gnd/' + binding.kal.value, 'label': 'Kalliope-Verbund'});
            if(binding.gnd && binding.gnd.value)wiki['links'].push({'url': 'https://d-nb.info/gnd/' + binding.gnd.value, 'label': 'GND (Gemeinsame Normdatei der Deutschen Nationalbibliothek)'});
            if(binding.sfa && binding.sfa.value)wiki['links'].push({'url': 'https://www.swiss-archives.ch/archivplansuche.aspx?ID=' + binding.sfa.value, 'label': 'Schweizerisches Bundesarchiv'});
            if(binding.loc && binding.loc.value)wiki['links'].push({'url': 'http://id.loc.gov/authorities/names/' + binding.loc.value + '.html', 'label': 'Library of Congress'});
            wiki['profiles'] = [];
            if(binding.orcid && binding.orcid.value)wiki['profiles'].push({'url': 'https://orcid.org/' + binding.orcid.value, 'label': 'linkOrcid'});
            if(binding.scholar && binding.scholar.value)wiki['profiles'].push({'url': 'https://scholar.google.com/citations?user=' + binding.scholar.value, 'label': 'linkScholar'});
            if(binding.scopus && binding.scopus.value)wiki['profiles'].push({'url': 'https://www.scopus.com/authid/detail.uri?authorId=' + binding.scopus.value, 'label': 'linkScopus'});
            if(binding.researchgate && binding.researchgate.value)wiki['profiles'].push({'url': 'https://www.researchgate.net/profile/' + binding.researchgate.value, 'label': 'linkResearchgate'});
            if(binding.dimension && binding.dimension.value)wiki['profiles'].push({'url': 'https://app.dimensions.ai/discover/publication?and_facet_researcher=ur.' + binding.dimension.value, 'label': 'linkDimension'});
            return wiki;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processWikiResponse');        
        }
    }


    private processWikipediaResponse(wikiResult: any, lang: any){
        try{
            if(!wikiResult[0] || !wikiResult[0].resp.results.bindings || wikiResult[0].resp.results.bindings.length === 0 || !wikiResult[0].resp.results.bindings[0].wikipediaUrlList){
                return;
            }
            let strWikipediaUrls = wikiResult[0].resp.results.bindings[0].wikipediaUrlList.value;
            if(!strWikipediaUrls || strWikipediaUrls === '')return;
            let wikipediaUrls = strWikipediaUrls.split(';');
            let search = lang + '.wikipedia.org';
            let displayUrl = wikipediaUrls.filter((u:any) => {
                return u.indexOf(search) > -1;
            })
            if(displayUrl.length > 0){
                return displayUrl[0];
            }
            else{
                search = 'en.wikipedia.org';
                displayUrl = wikipediaUrls.filter((u:any) => {
                    return u.indexOf(search) > -1;
                })
                if(displayUrl.length > 0){
                    return displayUrl[0];
                }
                else{
                    search = '.wikipedia.org';
                    displayUrl = wikipediaUrls.filter((u:any) => {
                        return u.indexOf(search) > -1;
                    })
                    if(displayUrl.length > 0){
                        return displayUrl[0];
                    }
                    else{
                        return null;
                    }
                }            
            }
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processWikipediaResponse');        
        }
    }

    private processRelatedPersonsResponse(wikiResult: any){
        try{
            if(!wikiResult[0] || !wikiResult[0].resp.results.bindings || wikiResult[0].resp.results.bindings.length === 0){
                return;
            }
            let persons = [];
            let lastItemValue = '';
            for(let i = 0; i < wikiResult[0].resp.results.bindings.length; i++){
                let binding = wikiResult[0].resp.results.bindings[i];
                if(binding.item.value != lastItemValue && binding.item.value.indexOf(binding.itemLabel.value) === -1){
                    let person:Record<string, any> = {};
                    lastItemValue = binding.item.value;
                    person['item'] = binding.item ? binding.item.value : null;
                    person['qid'] = binding.item ? binding.item.value.substring(binding.item.value.lastIndexOf('/')+1) : null;
                    person['label'] = binding.itemLabel ? binding.itemLabel.value : null;
                    person['gnd'] = binding.gndId ? binding.gndId.value : null;
                    person['image_url'] = binding.image ? binding.image.value : null;
                    person['description'] = binding.itemDescription ? binding.itemDescription.value : null;
                    if(binding.teacherBirths){
                        person['birth'] = binding.teacherBirths.value;
                    }
                    else if(binding.studentBirths){
                        person['birth'] = binding.studentBirths.value;
                    }
                    else{
                        person['birth'] = null;
                    }
                    if(binding.teacherDeaths){
                        person['death'] = binding.teacherDeaths.value;
                    }
                    else if(binding.studentDeaths){
                        person['death'] = binding.studentDeaths.value;
                    }
                    else{
                        person['death'] = null;
                    }
                    persons.push(person);
                }
            }
            return persons;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processRelatedPersonsResponse');
        }
    }

    private processwikiArchivesAtResponse(wikiResult:any){
        try{
            let wikiArchivesAtLinks = [];
            let bindings = wikiResult[0].resp.results.bindings;
            for(let i = 0; i < bindings.length; i++){
                let url = bindings[i].ref ? bindings[i].ref.value: null;
                let label =  bindings[i].archivedLabel ? bindings[i].archivedLabel.value : null;
                let inventoryno =  bindings[i].inventoryno ? bindings[i].inventoryno.value : null;
                wikiArchivesAtLinks.push({'url': url, 'label': label, 'inventoryno': inventoryno});
            }
            return wikiArchivesAtLinks;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processwikiArchivesAtResponse');        
        }
    }

    processMetagridResponse(metagridResult:any){
        try{
            let sourcesWhitelist = ["sudoc","hallernet", "fotostiftung", "sikart","elites-suisses-au-xxe-siecle","bsg", "dodis", "helveticarchives", "helveticat", "hls-dhs-dss", "histoirerurale","lonsea","ssrq","alfred-escher","geschichtedersozialensicherheit"];
            let resources = metagridResult[0].resp.concordances[0].resources;
            let whitelistedMetagridLinks: any[] = [];
            let whitelistedMetagridLinksSorted: string[] = [];

            if (!!resources[0] && resources.length > 0) {
                let name = resources[0].last_name + ', ' + resources[0].first_name;

                for(var j = 0; j < resources.length; j++){
                    let resource = resources[j];
                    // https://api.metagrid.ch/providers.json
                    let slug = resource.provider.slug;
                    let url = resource.link.uri;
                    // check whitelist for Metagrid links
                    if (sourcesWhitelist.indexOf(slug) === -1) {
                        continue;
                    }
                    whitelistedMetagridLinks.push({'slug': slug,'url': url, 'label': slug});
                }
                // Dodis and HLS first
                let dodis = whitelistedMetagridLinks.filter(e => {
                    return e.slug === 'dodis';
                });
                whitelistedMetagridLinksSorted = whitelistedMetagridLinksSorted.concat(dodis);
                let hls = whitelistedMetagridLinks.filter(e => {
                    return e.slug === 'hls-dhs-dss';
                });
                whitelistedMetagridLinksSorted = whitelistedMetagridLinksSorted.concat(hls);
                let rest = whitelistedMetagridLinks.filter(e => {
                    return e.slug !== 'hls-dhs-dss' && e.slug !== 'dodis';
                });
                whitelistedMetagridLinksSorted = whitelistedMetagridLinksSorted.concat(rest);
            }
            return whitelistedMetagridLinksSorted;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processMetagridResponse');        
        }
    }

    processPersonsResponse(results:any, lang:any){
        try{
            if(!lang)lang = 'de';
            let person: Record<string, any> = {};
            person['gnd'] = "";
            let resultWithGnd = results.filter( (e:any) =>{
                return e.gnd && e.gnd != "";
            })
            if(resultWithGnd.length > 0){
                person['gnd'] = resultWithGnd[0].gnd;
            }
            // DNB Entityfacts
            let entityfactsResult = results.filter((e:any) => {
                return e.provider === 'hub.culturegraph.org';
            });
            if(entityfactsResult.length > 0){
                person['entityfacts'] = this.processEntityfactsResponse(entityfactsResult);
            }

            // Metagrid
            let metagridResult = results.filter( (e:any) => {
                return e.provider === 'api.metagrid.ch';
            });
            if(metagridResult.length > 0 && metagridResult[0].resp.concordances && metagridResult[0].resp.concordances.length > 0){
                person['metagridLinks'] = this.processMetagridResponse(metagridResult);
            }

            // prometheus.lmu
            let prometheusResult = results.filter((e:any) => {
                return e.provider === 'prometheus.lmu.de';
            });
            if(prometheusResult.length > 0 && prometheusResult[0].resp && prometheusResult[0].resp[1]){
                person['prometheusLinks'] = this.processPrometheusResponse(prometheusResult);
            }
            // Wikidata teachers
            let wikiTeacherResult = results.filter((e:any) => {
                return e.provider === 'query.wikidata.org' && e.resp.head.vars.indexOf("teacherBirths") > -1;
            });
            if(wikiTeacherResult.length > 0){
                person['teachers'] = this.processRelatedPersonsResponse(wikiTeacherResult);
            }
            // Wikidata students
            let wikiStudentResult = results.filter((e:any) => {
                return e.provider === 'query.wikidata.org' && e.resp.head.vars.indexOf("studentBirths") > -1;
            });
            if(wikiStudentResult.length > 0){
                person['students'] = this.processRelatedPersonsResponse(wikiStudentResult);
            }
            // Wikidata teachers TODO comment
            let wikiWikipediaResult = results.filter((e:any) => {
                return e.provider === 'query.wikidata.org' && e.resp.head.vars.indexOf("wikipediaUrlList") > -1;
            });
            if(wikiWikipediaResult.length > 0){
                person['wikipediaUrl'] = this.processWikipediaResponse(wikiWikipediaResult, lang);
            }
            // Wikidata bio and Links
            let wikiResult = results.filter((e:any) => {
                return e.provider === 'query.wikidata.org' && e.resp.head.vars.indexOf("birth") > -1;
            });
            if(wikiResult.length > 0){
                person['wiki'] = this.processWikiResponse(wikiResult, lang);
            }

            // Wikidata archives at
            let wikiArchivesAtResult = results.filter((e:any) => {
                return e.provider === 'query.wikidata.org' && e.resp.head.vars.indexOf("refnode") > -1;
            });

            if(wikiArchivesAtResult.length > 0){
                person['wikiArchivesAtLinks'] = this.processwikiArchivesAtResponse(wikiArchivesAtResult);
            }
            //personId=n80002513&inst=41SLSP_ETH&vid=41SLSP_ETH:ETH&lang=de&docid=alma990016261860205503&context=L&adaptor=Local%20Search%20Engine
            if(person['wiki'] && person['wiki'].loc && person['wiki'].loc != ''){
                person['url'] = `/nde/entity/person?entityId=${person['wiki'].loc}&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=${lang}`;
            }
            else if(person['gnd']) {
                person['url'] = `/nde/entity/person?entityId=${person['gnd']}&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=${lang}`;            
            }
            // name
            if(person['entityfacts']?.preferredName){
                person['name'] = person['entityfacts']?.preferredName;
            }
            else if(person['wiki']?.label){
                person['name'] = person['wiki']?.label;
            }
            return person;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'ethPersonCardsService.processPersonsResponse');        
        }
    }

    getPersonPageLink(identifier:string): string{
        try{
           
            let url = `/nde/entity/person?entityId=${identifier}&vid=41SLSP_ETH:ETH_CUSTOMIZING`;
            return url;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'EthPersonService.getPersonPageLink');
        }
    }

    getPlacePageLink(identifier:string): string{
        try{
            let query = '[wd/place]' + identifier;
            let url = `/nde/search?query=${query}&tab=${this.tab}&search_scope=${this.scope}&vid=${this.vid}`;
            return url;
        }
        catch(error: any){
            return this.ethErrorHandlingService.handleSynchronError(error, 'EthPersonService.getPlacePageLink');
        }
    }

}


