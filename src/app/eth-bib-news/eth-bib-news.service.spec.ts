import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthBibNewsService } from './eth-bib-news.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

const BASE_URL = 'https://daas.library.ethz.ch/rib/v3/bib-news';

describe('EthBibNewsService', () => {
  let service: EthBibNewsService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EthBibNewsService,
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });

    service = TestBed.inject(EthBibNewsService);
    httpMock = TestBed.inject(HttpTestingController);
  });


  afterEach(() => {
    httpMock.verify();
  });


  it('requests news with default language', () => {
    const mockResponse = { id: '1', updated: '', title: 'Titel', link: '', appjson: '', entries: [] };

    service.getNews().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r => r.url === BASE_URL && r.params.get('lang') === 'de');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });


  it('requests news with provided language', () => {
    const mockResponse = { id: '1', updated: '', title: 'Title', link: '', appjson: '', entries: [] };

    service.getNews('en').subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(r => r.url === BASE_URL && r.params.get('lang') === 'en');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  
  it('logs and rethrows errors', () => {
    const errorEvent = new ProgressEvent('error');

    service.getNews('en').subscribe({
      next: () => fail('expected error'),
      error: err => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(r => r.url === BASE_URL && r.params.get('lang') === 'en');
    req.error(errorEvent, { status: 500, statusText: 'Server Error' });

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
