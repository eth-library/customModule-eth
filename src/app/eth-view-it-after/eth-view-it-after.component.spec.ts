import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthViewItAfterComponent } from './eth-view-it-after.component';

describe('EthViewItAfterComponent', () => {
  let component: EthViewItAfterComponent;
  let fixture: ComponentFixture<EthViewItAfterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthViewItAfterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthViewItAfterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
