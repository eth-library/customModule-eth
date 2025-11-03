import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthIllLinkComponent } from './eth-ill-link.component';

describe('EthIllLinkComponent', () => {
  let component: EthIllLinkComponent;
  let fixture: ComponentFixture<EthIllLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthIllLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthIllLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
