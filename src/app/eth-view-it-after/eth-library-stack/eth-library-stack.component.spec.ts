import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthLibraryStackComponent } from './eth-library-stack.component';

describe('EthLibraryStackComponent', () => {
  let component: EthLibraryStackComponent;
  let fixture: ComponentFixture<EthLibraryStackComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthLibraryStackComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLibraryStackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
