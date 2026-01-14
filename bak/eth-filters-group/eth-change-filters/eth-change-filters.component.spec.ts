import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthChangeFiltersComponent } from './eth-change-filters.component';

describe('EthChangeFiltersComponent', () => {
  let component: EthChangeFiltersComponent;
  let fixture: ComponentFixture<EthChangeFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthChangeFiltersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthChangeFiltersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
