import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthRecordAvailabilityAfterComponent } from './eth-record-availability-after.component';

describe('EthRecordAvailabilityAfterComponent', () => {
  let component: EthRecordAvailabilityAfterComponent;
  let fixture: ComponentFixture<EthRecordAvailabilityAfterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthRecordAvailabilityAfterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthRecordAvailabilityAfterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
