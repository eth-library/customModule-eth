import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthLogoSublineComponent } from './eth-logo-subline.component';

describe('EthLogoSublineComponent', () => {
  let component: EthLogoSublineComponent;
  let fixture: ComponentFixture<EthLogoSublineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthLogoSublineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLogoSublineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
