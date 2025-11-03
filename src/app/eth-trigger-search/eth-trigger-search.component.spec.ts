import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthTriggerSearchComponent } from './eth-trigger-search.component';

describe('EthTriggerSearchComponent', () => {
  let component: EthTriggerSearchComponent;
  let fixture: ComponentFixture<EthTriggerSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthTriggerSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthTriggerSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
