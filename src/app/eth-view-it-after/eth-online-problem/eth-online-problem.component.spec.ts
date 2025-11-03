import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthOnlineProblemComponent } from './eth-online-problem.component';

describe('EthOnlineProblemComponent', () => {
  let component: EthOnlineProblemComponent;
  let fixture: ComponentFixture<EthOnlineProblemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthOnlineProblemComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOnlineProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
