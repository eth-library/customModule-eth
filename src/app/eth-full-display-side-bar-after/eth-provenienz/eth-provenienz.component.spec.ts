import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthProvenienzComponent } from './eth-provenienz.component';

describe('EthProvenienzComponent', () => {
  let component: EthProvenienzComponent;
  let fixture: ComponentFixture<EthProvenienzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthProvenienzComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthProvenienzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
