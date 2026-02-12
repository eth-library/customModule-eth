import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthGetitLocationsfilterComponent } from './eth-getit-locationsfilter.component';

describe('EthGetitLocationsfilterComponent', () => {
  let component: EthGetitLocationsfilterComponent;
  let fixture: ComponentFixture<EthGetitLocationsfilterComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [EthGetitLocationsfilterComponent]
    });
    fixture = TestBed.createComponent(EthGetitLocationsfilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  
  it('sets filtersVisible on init', () => {
    component.hostComponent = {} as any;

    component.ngOnInit();

    expect(component.hostComponent.filtersVisible).toBeTrue();
  });
});
