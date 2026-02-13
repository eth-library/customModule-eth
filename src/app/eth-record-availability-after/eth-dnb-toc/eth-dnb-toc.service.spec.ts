import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthDnbTocService } from './eth-dnb-toc.service';
import { DnbTocApiResponse } from '../../models/eth.model';


describe('EthDnbTocService', () => {
  let service: EthDnbTocService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EthDnbTocService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(EthDnbTocService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  it('should be created', () => {
    expect(service).toBeTruthy();
  });


  it('should get a TOC link for a given ISBN', () => {
    const isbn = '979-1-02-100097-1';
    const mockResponse: DnbTocApiResponse = { } as DnbTocApiResponse;
    
    service.getTocLink(isbn).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/enrichments/dnb/toc/${encodeURIComponent(isbn)}`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });
});
