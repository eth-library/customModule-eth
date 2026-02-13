import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthComposeNbService } from './eth-compose-nb.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { NbPrintApiResponse, PrimoApiResponse } from '../../models/eth.model';


describe('EthComposeNbService', () => {
  let service: EthComposeNbService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
    TestBed.configureTestingModule({
      providers: [
        EthComposeNbService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });
    service = TestBed.inject(EthComposeNbService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should fetch print data', () => {
    const nebisId = 'ebi01_prod004464904';
    const mockResponse: NbPrintApiResponse = { "map":[{"almaSearch":"990044649040205503","legacyId":"ebi01_prod004464904","source":"Nebis"}] } as NbPrintApiResponse;
    service.getPrintData(nebisId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/mapping/redirect?result=map&id=${encodeURIComponent(nebisId)}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });


  it('should return null and not log error for 404 in getPrintData', () => {
    const nebisId = 'notexisting';
    service.getPrintData(nebisId).subscribe(response => {
      expect(response).toBeNull();
      expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
    });
    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/mapping/redirect?result=map&id=${encodeURIComponent(nebisId)}`
    );
    req.flush({}, { status: 404, statusText: 'Not Found' });
  });


  it('should log error for non-404 in getPrintData', () => {
    const nebisId = 'err';
    service.getPrintData(nebisId).subscribe(response => {
      expect(response).toBeNull();
      expect(errorHandlingSpy.logError).toHaveBeenCalled();
    });
    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/mapping/redirect?result=map&id=${encodeURIComponent(nebisId)}`
    );
    req.flush({}, { status: 500, statusText: 'Server Error' });
  });


  it('should fetch online data', () => {
    const oaiId = 'oai:agora.ch:004464904';
    const mockResponse: PrimoApiResponse = { "docs": [{"pnx": {"display": {"source": ["eth_nachlassbibliothek"],"type": ["book"],"title": ["Goethes Schweizer Reise 1775"]}}}]}  as PrimoApiResponse;
    service.getOnlineData(oaiId).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/search?limit=50&q=any,contains,${encodeURIComponent(oaiId)}`
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });


  it('should return null and not log error for 404 in getOnlineData', () => {
    const oaiId = 'notexisting';
    service.getOnlineData(oaiId).subscribe(response => {
      expect(response).toBeNull();
      expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
    });
    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/search?limit=50&q=any,contains,${encodeURIComponent(oaiId)}`
    );
    req.flush({}, { status: 404, statusText: 'Not Found' });
  });


  it('should log error for non-404 in getOnlineData', () => {
    const oaiId = 'err';
    service.getOnlineData(oaiId).subscribe(response => {
      expect(response).toBeNull();
      expect(errorHandlingSpy.logError).toHaveBeenCalled();
    });
    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/search?limit=50&q=any,contains,${encodeURIComponent(oaiId)}`
    );
    req.flush({}, { status: 500, statusText: 'Server Error' });
  });

});
