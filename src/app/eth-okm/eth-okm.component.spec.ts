import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthOKMComponent } from './eth-okm.component';

describe('EthOKMComponent', () => {
  let component: EthOKMComponent;
  let fixture: ComponentFixture<EthOKMComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthOKMComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOKMComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
