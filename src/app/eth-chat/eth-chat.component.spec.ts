import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthChatComponent } from './eth-chat.component';

describe('EthChatComponent', () => {
  let component: EthChatComponent;
  let fixture: ComponentFixture<EthChatComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthChatComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
