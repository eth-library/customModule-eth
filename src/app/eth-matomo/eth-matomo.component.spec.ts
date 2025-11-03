import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthMatomoComponent } from './eth-matomo.component';

describe('EthMatomoComponent', () => {
  let component: EthMatomoComponent;
  let fixture: ComponentFixture<EthMatomoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EthMatomoComponent]
    });
    fixture = TestBed.createComponent(EthMatomoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
