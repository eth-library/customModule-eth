import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthLocationHintComponent } from './eth-location-hint.component';

describe('EthLocationHintComponent', () => {
  let component: EthLocationHintComponent;
  let fixture: ComponentFixture<EthLocationHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthLocationHintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLocationHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
