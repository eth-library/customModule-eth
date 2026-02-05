import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthDnbTocComponent } from './eth-dnb-toc.component';

describe('EthDnbTocComponent', () => {
  let component: EthDnbTocComponent;
  let fixture: ComponentFixture<EthDnbTocComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthDnbTocComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthDnbTocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
