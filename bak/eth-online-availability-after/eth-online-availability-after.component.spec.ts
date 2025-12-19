import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthOnlineAvailabilityAfterComponent } from './eth-online-availability-after.component';

describe('EthOnlineAvailabilityAfterComponent', () => {
  let component: EthOnlineAvailabilityAfterComponent;
  let fixture: ComponentFixture<EthOnlineAvailabilityAfterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthOnlineAvailabilityAfterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOnlineAvailabilityAfterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
