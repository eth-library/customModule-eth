import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthProvenienzEraraLinkComponent } from './eth-provenienz-erara-link.component';

describe('EthProvenienzEraraLinkComponent', () => {
  let component: EthProvenienzEraraLinkComponent;
  let fixture: ComponentFixture<EthProvenienzEraraLinkComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthProvenienzEraraLinkComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthProvenienzEraraLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
