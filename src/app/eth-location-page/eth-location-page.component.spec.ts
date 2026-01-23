import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthLocationPageComponent } from './eth-location-page.component';

describe('EthLocationPageComponent', () => {
  let component: EthLocationPageComponent;
  let fixture: ComponentFixture<EthLocationPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthLocationPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLocationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
