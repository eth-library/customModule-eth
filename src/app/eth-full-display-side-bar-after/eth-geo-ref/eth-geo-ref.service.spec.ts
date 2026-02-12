import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthGeoRefService } from './eth-geo-ref.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthoramaPoi } from '../../models/eth.model';

describe('EthGeoRefService', () => {
  let service: EthGeoRefService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EthGeoRefService,
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });

    service = TestBed.inject(EthGeoRefService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('requests places from lobid (with gnd ids) to get more identifier', () => {
    service.getPlacesFromLobid('4066337-1,117561940').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/places/lobid/gnds?gnds=4066337-1,117561940');
    expect(req.request.method).toBe('GET');
    req.flush({ member: [] });
  });


  it('requests places from ETHorama with docId', () => {
    service.getPlacesFromETHorama('990038990900205503').subscribe();

    const req = httpMock.expectOne(r => r.url.includes('https://api.library.ethz.ch/ethorama/v1/pois') && r.url.includes('docId=990038990900205503'));
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });
  

  it('requests gnd places from graph with gnd list', () => {
    service.getGndPlacesFromGraph('4018272-1').subscribe();

    const req = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/graph/places-by-gnd-list?gnd=4018272-1');
    expect(req.request.method).toBe('GET');
    req.flush({ results: [] });
  });


  it('returns empty array when enrichPOIs receives no items', () => {
    service.enrichPOIs([]).subscribe(result => {
      expect(result).toEqual([]);
    });

    httpMock.expectNone(() => true);
  });


  it('enriches POIs and returns fallback on error', () => {
    const pois: EthoramaPoi[] = [
      { id: 'poi-1', thumbnail: 'thumb-1' } as EthoramaPoi,
      { id: 'poi-2', thumbnail: 'thumb-2' } as EthoramaPoi
    ];

    service.enrichPOIs(pois).subscribe(result => {
      expect(result.length).toBe(2);
      expect(result[0].qid).toBe('Q1');
      expect(result[0].name).toBe('Place One');
      expect(result[0].descriptionWikidata).toBe('Desc One');
      expect(result[0].thumbnail).toBe('thumb-1');

      expect(result[1].qid).toBe('');
      expect(result[1].name).toBe('');
      expect(result[1].descriptionWikidata).toBe('');
      expect(result[1].thumbnail).toBe('thumb-2');
    });

    const req1 = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/graph/pois/poi-1');
    expect(req1.request.method).toBe('GET');
    req1.flush({
      features: [
        {
          properties: {
            qid: 'Q1',
            lccn: 'L1',
            gnd: 'G1',
            name_de: 'Place One',
            descriptionWikidata: 'Desc One'
          }
        }
      ]
    });

    const req2 = httpMock.expectOne('https://daas.library.ethz.ch/rib/v3/graph/pois/poi-2');
    req2.flush('fail', { status: 500, statusText: 'Server Error' });

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
