import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthWaybackComponent } from './eth-wayback.component';

describe('EthWaybackComponent', () => {
  let component: EthWaybackComponent;
  let fixture: ComponentFixture<EthWaybackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthWaybackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthWaybackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
