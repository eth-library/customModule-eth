import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthFiltersGroupComponent } from './eth-filters-group.component';

describe('EthFiltersGroupComponent', () => {
  let component: EthFiltersGroupComponent;
  let fixture: ComponentFixture<EthFiltersGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthFiltersGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthFiltersGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
