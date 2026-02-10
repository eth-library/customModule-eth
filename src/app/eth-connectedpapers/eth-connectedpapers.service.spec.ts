import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthConnectedpapersService } from './eth-connectedpapers.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { ConnectedPapersAPIResponse } from '../models/eth.model';

describe('EthConnectedpapersService', () => {
  let service: EthConnectedpapersService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EthConnectedpapersService,
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });

    service = TestBed.inject(EthConnectedpapersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('returns null without calling http when doi is empty', () => {
    service.getPaper('').subscribe(response => {
      expect(response).toBeNull();
    });

    httpMock.expectNone(() => true);
  });

  
  it('requests the paper for a doi', () => {
    const mockResponse: ConnectedPapersAPIResponse = { id: 'p1' };
    const doi = '10.1000/test';
    const url = 'https://daas.library.ethz.ch/rib/v3/enrichments/connectedpapers?doi=' + doi;

    service.getPaper(doi).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(url);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });


  it('returns null for 404 responses without logging', () => {
    const doi = '10.404/none';
    const url = 'https://daas.library.ethz.ch/rib/v3/enrichments/connectedpapers?doi=' + doi;

    service.getPaper(doi).subscribe(response => {
      expect(response).toBeNull();
    });

    const req = httpMock.expectOne(url);
    req.flush('not found', { status: 404, statusText: 'Not Found' });

    expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
  });


  it('logs and rethrows non-404 errors', () => {
    const doi = '10.500/error';
    const url = 'https://daas.library.ethz.ch/rib/v3/enrichments/connectedpapers?doi=' + doi;

    service.getPaper(doi).subscribe({
      next: () => fail('expected error'),
      error: err => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(url);
    req.flush('fail', { status: 500, statusText: 'Server Error' });

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
