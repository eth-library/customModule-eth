import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthPersonCardsComponent } from './eth-person-cards.component';

describe('EthPersonCardsComponent', () => {
  let component: EthPersonCardsComponent;
  let fixture: ComponentFixture<EthPersonCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthPersonCardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthPersonCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
