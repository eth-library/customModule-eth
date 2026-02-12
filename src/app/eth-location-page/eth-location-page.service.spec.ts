import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EthLocationPageService } from './eth-location-page.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';


describe('EthLocationPageService', () => {
  let service: EthLocationPageService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        EthLocationPageService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });

    service = TestBed.inject(EthLocationPageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('requests ETHorama place by qid', () => {
    service.getPlaceFromETHorama('Q123').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.startsWith('https://api.library.ethz.ch/ethorama/v1/pois')
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('qId=Q123');
    req.flush({ items: [] });
  });


  it('requests topics from geo graph', () => {
    service.getTopicsFromGeoGraph('G1', 'Q1').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.startsWith('https://api.library.ethz.ch/geo/v1/geo-topics')
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('qid=Q1');
    expect(req.request.urlWithParams).toContain('gnd=G1');
    req.flush({ features: [] });
  });


  it('requests maps from geo graph', () => {
    service.getMapsFromGeoGraph('47.3', '8.5').subscribe();

    const req = httpMock.expectOne((request) =>
      request.url.startsWith('https://api.library.ethz.ch/geo/v1/maps')
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.urlWithParams).toContain('lat=47.3');
    expect(req.request.urlWithParams).toContain('lon=8.5');
    req.flush({ features: [] });
  });


  it('requests wikidata place by qid', () => {
    service.getPlaceFromWikidata(undefined, 'Q72', 'de').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/places//Q72?lang=de');
    expect(req.request.method).toBe('GET');
    req.flush({ results: { bindings: [] } });
  });


  it('requests identifier for lccn', () => {
    service.getIdentifierForLccn('n79007751').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/places/lccn-identifier/n79007751');
    expect(req.request.method).toBe('GET');
    req.flush({ results: { bindings: [] } });
  });

  
  it('logs errors from getPlaceFromWikidata', () => {
    service.getPlaceFromWikidata('G1', undefined, 'de').subscribe({
      error: () => {
        // expected
      }
    });

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/places//gnd/G1?lang=de');
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
