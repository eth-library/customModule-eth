import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthGitHintService } from './eth-git-hint.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { GitHintAPIResponse } from '../models/eth.model';

const BASE_URL = 'https://daas.library.ethz.ch/rib/v3/nde/git-hint';

describe('EthGitHintService', () => {
  let service: EthGitHintService;
  let httpMock: HttpTestingController;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EthGitHintService,
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });

    service = TestBed.inject(EthGitHintService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('returns the hint for the requested language', () => {
    const mockResponse: GitHintAPIResponse = { de: 'Hallo', en: 'Hello' };

    service.getHint('en').subscribe(response => {
      expect(response).toBe('Hello');
    });

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });


  it('logs and rethrows errors', () => {
    service.getHint('de').subscribe({
      next: () => fail('expected error'),
      error: err => {
        expect(err).toBeTruthy();
      }
    });

    const req = httpMock.expectOne(BASE_URL);
    req.flush('fail', { status: 500, statusText: 'Server Error' });

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
