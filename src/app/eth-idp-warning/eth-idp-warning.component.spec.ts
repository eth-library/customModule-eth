import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthIdpWarningComponent } from './eth-idp-warning.component';

describe('EthIdpWarningComponent', () => {
  let component: EthIdpWarningComponent;
  let fixture: ComponentFixture<EthIdpWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthIdpWarningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthIdpWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
