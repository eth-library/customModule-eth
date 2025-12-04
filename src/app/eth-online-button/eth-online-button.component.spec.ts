import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthOnlineButtonComponent } from './eth-online-button.component';

describe('EthOnlineButtonComponent', () => {
  let component: EthOnlineButtonComponent;
  let fixture: ComponentFixture<EthOnlineButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthOnlineButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOnlineButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
