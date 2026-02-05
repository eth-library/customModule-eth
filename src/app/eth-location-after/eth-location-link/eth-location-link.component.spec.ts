import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthLocationLinkComponent } from './eth-location-link.component';

describe('EthLocationLinkComponent', () => {
  let component: EthLocationLinkComponent;
  let fixture: ComponentFixture<EthLocationLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthLocationLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLocationLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
