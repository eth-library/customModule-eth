import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthTopbarMessageComponent } from './eth-topbar-message.component';

describe('EthTopbarMessageComponent', () => {
  let component: EthTopbarMessageComponent;
  let fixture: ComponentFixture<EthTopbarMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthTopbarMessageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthTopbarMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
