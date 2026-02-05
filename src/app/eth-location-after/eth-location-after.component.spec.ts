import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthLocationAfterComponent } from './eth-location-after.component';

describe('EthLocationAfterComponent', () => {
  let component: EthLocationAfterComponent;
  let fixture: ComponentFixture<EthLocationAfterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthLocationAfterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLocationAfterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
