import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthGeoRefComponent } from './eth-geo-ref.component';

describe('EthGeoRefComponent', () => {
  let component: EthGeoRefComponent;
  let fixture: ComponentFixture<EthGeoRefComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthGeoRefComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthGeoRefComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
