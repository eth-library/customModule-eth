import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthBrowzineComponent } from './eth-browzine.component';

describe('EthBrowzineComponent', () => {
  let component: EthBrowzineComponent;
  let fixture: ComponentFixture<EthBrowzineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthBrowzineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthBrowzineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
