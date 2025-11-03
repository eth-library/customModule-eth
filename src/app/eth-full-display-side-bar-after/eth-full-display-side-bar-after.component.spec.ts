import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthFullDisplaySideBarAfterComponent } from './eth-full-display-side-bar-after.component';

describe('EthFullDisplaySideBarComponent', () => {
  let component: EthFullDisplaySideBarAfterComponent;
  let fixture: ComponentFixture<EthFullDisplaySideBarAfterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthFullDisplaySideBarAfterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthFullDisplaySideBarAfterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
