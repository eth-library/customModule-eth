import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EthProvenienzService } from './eth-provenienz.service';


describe('EthProvenienzService', () => {
  let service: EthProvenienzService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        EthProvenienzService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(EthProvenienzService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests items by doi', () => {
    const doi = '10.3931/e-rara-9423';

    service.getItems(doi).subscribe();

    const req = httpMock.expectOne(
      `https://daas.library.ethz.ch/rib/v3/ba/provenienz/doi?doi=${encodeURIComponent(doi)}`
    );
    expect(req.request.method).toBe('GET');
    req.flush({ items: [] });
  });
});
