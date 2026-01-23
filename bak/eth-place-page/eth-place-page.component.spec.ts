import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthPlacePageComponent } from './eth-place-page.component';

describe('EthPlacePageComponent', () => {
  let component: EthPlacePageComponent;
  let fixture: ComponentFixture<EthPlacePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthPlacePageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthPlacePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
