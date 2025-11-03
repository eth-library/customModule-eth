import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthRegistrationLinkComponent } from './eth-registration-link.component';

describe('EthRegistrationLinkComponent', () => {
  let component: EthRegistrationLinkComponent;
  let fixture: ComponentFixture<EthRegistrationLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthRegistrationLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthRegistrationLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
