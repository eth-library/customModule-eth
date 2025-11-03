import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthOffcampusWarningComponent } from './eth-offcampus-warning.component';

describe('EthOffcampusWarningComponent', () => {
  let component: EthOffcampusWarningComponent;
  let fixture: ComponentFixture<EthOffcampusWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthOffcampusWarningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOffcampusWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
