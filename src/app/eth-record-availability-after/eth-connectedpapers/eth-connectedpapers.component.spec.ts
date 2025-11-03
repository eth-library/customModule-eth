import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthConnectedpapersComponent } from './eth-connectedpapers.component';

describe('EthConnectedpapersComponent', () => {
  let component: EthConnectedpapersComponent;
  let fixture: ComponentFixture<EthConnectedpapersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthConnectedpapersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthConnectedpapersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
