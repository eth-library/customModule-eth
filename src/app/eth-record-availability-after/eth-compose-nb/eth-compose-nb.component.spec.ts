import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthComposeNbComponent } from './eth-compose-nb.component';

describe('EthComposeNbComponent', () => {
  let component: EthComposeNbComponent;
  let fixture: ComponentFixture<EthComposeNbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthComposeNbComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthComposeNbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
