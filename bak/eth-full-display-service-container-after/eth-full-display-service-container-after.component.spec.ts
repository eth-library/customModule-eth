import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthFullDisplayServiceContainerAfterComponent } from './eth-full-display-service-container-after.component';

describe('EthFullDisplayServiceContainerAfterComponent', () => {
  let component: EthFullDisplayServiceContainerAfterComponent;
  let fixture: ComponentFixture<EthFullDisplayServiceContainerAfterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthFullDisplayServiceContainerAfterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthFullDisplayServiceContainerAfterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
