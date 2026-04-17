import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { EthRequestHintsComponent } from './eth-request-hints.component';
import { EthStoreService } from '../services/eth-store.service';

const ethStoreServiceMock = {
  userGroup$: of('ETH_Member'),
};

const translateServiceMock = {
  get: (key: string) => of(key),
};

describe('EthRequestHintsComponent', () => {
  let component: EthRequestHintsComponent;
  let fixture: ComponentFixture<EthRequestHintsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthRequestHintsComponent],
      providers: [
        { provide: EthStoreService, useValue: ethStoreServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthRequestHintsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
