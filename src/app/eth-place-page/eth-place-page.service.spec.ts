import { TestBed } from '@angular/core/testing';

import { EthPlacePageService } from './eth-place-page.service';

describe('EthPlacePageService', () => {
  let service: EthPlacePageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EthPlacePageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
