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
      'logSyncError'
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
});
