import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthChangeAdressComponent } from './eth-change-adress.component';

describe('EthChangeAdressComponent', () => {
  let component: EthChangeAdressComponent;
  let fixture: ComponentFixture<EthChangeAdressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthChangeAdressComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthChangeAdressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
