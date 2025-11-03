import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthPersonPageComponent } from './eth-person-page.component';

describe('EthPersonPageComponent', () => {
  let component: EthPersonPageComponent;
  let fixture: ComponentFixture<EthPersonPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthPersonPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthPersonPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
