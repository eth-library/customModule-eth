import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthThemeComponent } from './eth-theme.component';

describe('EthThemeComponent', () => {
  let component: EthThemeComponent;
  let fixture: ComponentFixture<EthThemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthThemeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
