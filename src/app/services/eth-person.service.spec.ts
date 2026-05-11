import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EthPersonService } from './eth-person.service';
import { EthErrorHandlingService } from './eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';


describe('EthPersonService', () => {
  let service: EthPersonService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  const translateMock = { currentLang: 'de' } as TranslateService;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError',
      'logError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        EthPersonService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    });

    service = TestBed.inject(EthPersonService);
    httpMock = TestBed.inject(HttpTestingController);
  });


  afterEach(() => {
    httpMock.verify();
  });


  it('get persons by a list of GNDs', () => {
    service.getPersons('123,456', 'de').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-gnd-short?gnd=123,456&lang=de');
    expect(req.request.method).toBe('GET');
    req.flush({ gnd: [], results: [] });
  });


  it('resolves getPerson() with QID', () => {
    service.getPerson('Q123', 'de').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-qid?qid=Q123&lang=de');
    expect(req.request.method).toBe('GET');
    req.flush({ gnd: [], results: [] });
  });


  it('resolves getPerson() with LCCN', () => {
    service.getPerson('n79007751', 'de').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-lccn?lccn=n79007751&lang=de');
    expect(req.request.method).toBe('GET');
    req.flush({ gnd: [], results: [] });
  });


  it('resolves getPerson() with GND', () => {
    service.getPerson('123', 'de').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-gnd?gnd=123&lang=de');
    expect(req.request.method).toBe('GET');
    req.flush({ gnd: [], results: [] });
  });


  it('returns null when getGndByIdRef() returns 404', () => {
    service.getGndByIdRef('123').subscribe(value => {
      expect(value).toBeNull();
    });

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/gnd/sudoc/123');
    req.flush('not found', { status: 404, statusText: 'Not Found' });
  });


  it('encodes search queries', () => {
    service.searchPrimoData('any,contains,Name A', 'TAB', 'SCOPE', 'de').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.startsWith('https://daas.library.ethz.ch/rib/v3/search')
    );
    expect(req.request.urlWithParams).toContain('q=any%2Ccontains%2CName%20A');
    req.flush({ info: { totalResultsLocal: 0 } });
  });


  it('logs errors from getPersonByGnd', () => {
    service.getPerson('123', 'de').subscribe({
      error: () => {
        // expected
      }
    });

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-gnd?gnd=123&lang=de');
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });


  it('returns correct person page URL', () => {
    const url = service.getPersonPageUrl('Q123');
    expect(url).toBe('/entity/person?entityId=Q123&vid=41SLSP_ETH:ETH_CUSTOMIZING');
  });


  it('returns correct place page link', () => {
    const url = service.getPlacePageLink('Q456');
    expect(url).toContain('[wd/place]Q456');
    expect(url).toContain('/nde/search?query=');
  });


  it('returns provider label for current language', () => {
    (translateMock as any).currentLang = 'de';
    expect(service.getProviderLabel('gnd')).toBe('Gemeinsame Normdatei (GND)');
    (translateMock as any).currentLang = 'en';
    expect(service.getProviderLabel('gnd')).toBe('Integrated authority file (GND)');
    (translateMock as any).currentLang = 'fr';
    expect(service.getProviderLabel('gnd')).toBe('Integrated authority file (GND)');
    (translateMock as any).currentLang = 'it';
    expect(service.getProviderLabel('gnd')).toBe('Integrated authority file (GND)');
  });


  it('returns slug if provider label is missing', () => {
    (translateMock as any).currentLang = 'de';
    expect(service.getProviderLabel('unknown-provider')).toBe('unknown-provider');
  });


  it('getGndByIdRef propagates errors except 404', (done) => {
    service.getGndByIdRef('fail').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      }
    });
    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/gnd/sudoc/fail');
    req.flush('fail', { status: 500, statusText: 'Server Error' });
  });


  it('searchPrimoData propagates errors', (done) => {
    service.searchPrimoData('foo', 'TAB', 'SCOPE', 'de').subscribe({
      next: () => fail('should error'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(errorHandlingSpy.logError).toHaveBeenCalled();
        done();
      }
    });
    const req = httpMock.expectOne((request) => request.url.includes('/search'));
    req.flush('fail', { status: 500, statusText: 'Server Error' });
  });  


  it('logs non-500 errors from getPersons()', () => {
    errorHandlingSpy.logError.calls.reset();

    service.getPersons('123', 'de').subscribe({
      error: () => {
        // expected
      }
    });

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-gnd-short?gnd=123&lang=de');
    req.flush('bad request', { status: 400, statusText: 'Bad Request' });

    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.anything(), 'EthPersonService.getPersons');
  });


  it('does not log getPersons() 500 errors', () => {
    errorHandlingSpy.logError.calls.reset();

    service.getPersons('123', 'de').subscribe({ error: () => {} });

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/persons/person-gnd-short?gnd=123&lang=de');
    req.flush('server error', { status: 500, statusText: 'Error' });

    expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
  });


  it('processPrometheusResponse filters and relabels URLs', () => {
    const resp: any = [
      [],
      ['Label DB 1', 'Label DB 2', 'Label EPics', 'Ignored'],
      [],
      [
        'https://www.deutsche-biographie.de/person1',
        'https://www.deutsche-biographie.de/person2',
        'https://ba.e-pics.ethz.ch/foo',
        'https://archivdatenbank-online.ethz.ch/hsa/bar'
      ]
    ];

    const links = (service as any).processPrometheusResponse(resp);

    expect(links.length).toBe(3);
    expect(links[0]).toEqual({ url: 'https://www.deutsche-biographie.de/person1', label: 'Deutsche Biographie' });
    expect(links[1].label).toBe('Bilder im E-Pics Bildarchiv');
    expect(links[2].label).toBe('Hochschularchiv der ETH Zürich');
  });


  it('processEntityfactsResponse maps places, ids, and related persons', () => {
    const resp: any = {
      '@type': 'person',
      preferredName: 'Entity Name',
      biographicalOrHistoricalInformation: 'Bio',
      professionOrOccupation: [{ '@id': '1', preferredName: 'Engineer' }],
      dateOfBirth: '1900',
      dateOfDeath: '1980',
      depiction: { '@id': 'img', url: 'img.jpg' },
      familialRelationship: [{ '@id': 'http://d-nb.info/gnd/1', preferredName: 'Parent', relationship: 'mother' }],
      relatedPerson: [{ '@id': 'http://d-nb.info/gnd/2', preferredName: 'Sibling' }],
      placeOfActivity: [{ '@id': 'http://d-nb.info/gnd/3', preferredName: 'Zurich' }],
      placeOfBirth: [{ '@id': 'http://d-nb.info/gnd/4', preferredName: 'Bern' }],
      sameAs: [
        { '@id': 'http://id.loc.gov/authorities/names/n123', collection: { abbr: 'LC' } },
        { '@id': 'https://www.wikidata.org/entity/Q987', collection: { abbr: 'WIKIDATA' } }
      ]
    };

    const ef = (service as any).processEntityfactsResponse(resp);

    expect(ef.preferredName).toBe('Entity Name');
    expect(ef.placesOfActivity?.[0]).toEqual({ gnd: '3', name: 'Zurich' });
    expect(ef.placesOfBirth?.[0]).toEqual({ gnd: '4', name: 'Bern' });
    expect(ef.relatedPersons.length).toBe(2);
    expect(ef.lccn).toBe('n123');
    expect(ef.qid).toBe('Q987');
  });


  it('processWikiResponse builds links and profiles', () => {
    const resp: any = {
      results: {
        bindings: [{
          item: { value: 'https://www.wikidata.org/entity/Q1' },
          loc: { value: 'LOC1' },
          itemLabel: { value: 'Label' },
          itemDescription: { value: 'Desc' },
          image: { value: 'img.jpg' },
          birth: { value: '1900-01-01' },
          death: { value: '1950-01-01' },
          birthplaceLabel: { value: 'City' },
          deathplaceLabel: { value: 'Town' },
          aliasList: { value: 'Alias1|Alias2' },
          wc: { value: 'Category:Foo' },
          hls: { value: '123' },
          orcid: { value: '0000-0000' },
          scholar: { value: 'scholarId' },
          scopus: { value: '12345' },
          researchgate: { value: 'Researcher' },
          dimension: { value: 'dim123' }
        }]
      }
    };

    const wiki = (service as any).processWikiResponse(resp);

    expect(wiki?.links?.length).toBe(3);
    expect(wiki?.profiles?.length).toBe(5);
    expect(wiki?.aVariants?.[0]).toBe('Label');
    expect(wiki?.qid).toBe('Q1');
    expect(wiki?.loc).toBe('LOC1');
  });


  it('processWikipediaUrlListResponse prioritizes requested language', () => {
    const resp: any = {
      results: {
        bindings: [{
          wikipediaUrlList: { value: 'https://en.wikipedia.org/wiki/Entity;https://de.wikipedia.org/wiki/Entity' }
        }]
      }
    };

    const url = (service as any).processWikipediaUrlListResponse(resp, 'de');
    expect(url).toBe('https://de.wikipedia.org/wiki/Entity');

    const fallback = (service as any).processWikipediaUrlListResponse(resp, 'fr');
    expect(fallback).toBe('https://en.wikipedia.org/wiki/Entity');
  });


  it('processRelatedPersonsResponse removes duplicates and skips invalid entries', () => {
    const resp: any = {
      results: {
        bindings: [
          {
            item: { value: 'https://www.wikidata.org/entity/Q10' },
            itemLabel: { value: 'Person A' },
            itemDescription: { value: 'Desc' },
            image: { value: 'img' },
            gndId: { value: 'gndA' },
            teacherBirths: { value: '1900' }
          },
          {
            item: { value: 'https://www.wikidata.org/entity/Person A' },
            itemLabel: { value: 'Person A' },
            teacherBirths: { value: '1900' }
          },
          {
            itemLabel: { value: 'Missing Item' }
          }
        ]
      }
    };

    const persons = (service as any).processRelatedPersonsResponse(resp);

    expect(persons.length).toBe(1);
    expect(persons[0].qid).toBe('Q10');
    expect(persons[0].name).toBe('Person A');
  });


  it('processWikiArchivesAtResponse maps entries and logs errors', () => {
    errorHandlingSpy.logError.calls.reset();
    const resp: any = {
      results: {
        bindings: [{
          ref: { value: 'http://archives/1' },
          archivedLabel: { value: 'Archive Label' },
          inventoryno: { value: 'INV' }
        }]
      }
    };

    const links = (service as any).processWikiArchivesAtResponse(resp);
    expect(links).toEqual([{ url: 'http://archives/1', label: 'Archive Label', inventoryno: 'INV' }]);

    const fallback = (service as any).processWikiArchivesAtResponse(null);
    expect(fallback).toEqual([]);
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.anything(), 'EthPersonService.processWikiArchivesAtResponse');
  });


  it('processMetagridResponse whitelists providers and keeps order', () => {
    const resp: any = {
      meta: { limit: 1, start: 0, total: 1, uri: '' },
      concordances: [{
        resources: [
          { provider: { slug: 'sikart' }, link: { uri: 'https://sikart' } },
          { provider: { slug: 'dodis' }, link: { uri: 'https://dodis' } },
          { provider: { slug: 'hls-dhs-dss' }, link: { uri: 'https://hls' } },
          { provider: { slug: 'unknown' }, link: { uri: 'https://ignored' } }
        ]
      }]
    };

    const links = (service as any).processMetagridResponse(resp);

    expect(links.map((l: any) => l.slug)).toEqual(['dodis', 'hls-dhs-dss', 'sikart']);
  });


  it('processPersonsResponse aggregates upstream provider payloads', () => {
    const personResp: any = {
      results: [
        {
          gnd: 'GND123',
          provider: 'hub.culturegraph.org',
          resp: {
            '@type': 'person',
            preferredName: 'Entity Name',
            familialRelationship: [],
            relatedPerson: [],
            sameAs: [
              { '@id': 'http://id.loc.gov/authorities/names/n1', collection: { abbr: 'LC' } },
              { '@id': 'https://www.wikidata.org/entity/Q100', collection: { abbr: 'WIKIDATA' } }
            ]
          }
        },
        {
          provider: 'api.metagrid.ch',
          resp: {
            meta: { limit: 1, start: 0, total: 1, uri: '' },
            concordances: [{ resources: [{ provider: { slug: 'dodis' }, link: { uri: 'https://dodis' } }] }]
          }
        },
        {
          provider: 'prometheus.lmu.de',
          resp: [
            [],
            ['Label'],
            [],
            ['https://ba.e-pics.ethz.ch/foo']
          ]
        },
        {
          provider: 'query.wikidata.org',
          resp: {
            head: { vars: ['teacherBirths'] },
            results: { bindings: [{ item: { value: 'https://www.wikidata.org/entity/QT' }, itemLabel: { value: 'Teacher' } }] }
          }
        },
        {
          provider: 'query.wikidata.org',
          resp: {
            head: { vars: ['studentBirths'] },
            results: { bindings: [{ item: { value: 'https://www.wikidata.org/entity/QS' }, itemLabel: { value: 'Student' } }] }
          }
        },
        {
          provider: 'query.wikidata.org',
          resp: {
            head: { vars: ['wikipediaUrlList'] },
            results: { bindings: [{ wikipediaUrlList: { value: 'https://de.wikipedia.org/wiki/Entity' } }] }
          }
        },
        {
          provider: 'query.wikidata.org',
          resp: {
            head: { vars: ['birth'] },
            results: {
              bindings: [{
                item: { value: 'https://www.wikidata.org/entity/Q100' },
                itemLabel: { value: 'Wiki Label' },
                loc: { value: 'LOC100' },
                birth: { value: '1900' }
              }]
            }
          }
        },
        {
          provider: 'query.wikidata.org',
          resp: {
            head: { vars: ['refnode'] },
            results: { bindings: [{ ref: { value: 'http://archives/1' }, archivedLabel: { value: 'Archive' } }] }
          }
        }
      ]
    };

    const person = service.processPersonsResponse(personResp, '');

    expect(person.gnd).toBe('GND123');
    expect(person.entityfacts?.preferredName).toBe('Entity Name');
    expect(person.metagridLinks?.[0].url).toBe('https://dodis');
    expect(person.prometheusLinks?.length).toBeGreaterThan(0);
    expect(person.teachers?.length).toBe(1);
    expect(person.students?.length).toBe(1);
    expect(person.wikipediaUrl).toBe('https://de.wikipedia.org/wiki/Entity');
    expect(person.wikiArchivesAtLinks?.[0].url).toBe('http://archives/1');
    expect(person.url).toBe('/entity/person?entityId=LOC100&vid=41SLSP_ETH:ETH_CUSTOMIZING&lang=de');
    expect(person.name).toBe('Entity Name');
    expect(person.qid).toBe('Q100');
  });


  it('processPersonsResponse logs failures and returns fallback object', () => {
    errorHandlingSpy.logError.calls.reset();

    const person = service.processPersonsResponse({} as any, 'de');

    expect(person).toEqual({ gnd: '', url: '' });
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.anything(), 'EthPersonService.processPersonsResponse');
  });

});