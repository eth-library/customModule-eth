import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthComposeEraraComponent } from './eth-compose-erara.component';

describe('EthComposeEraraComponent', () => {
  let component: EthComposeEraraComponent;
  let fixture: ComponentFixture<EthComposeEraraComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthComposeEraraComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthComposeEraraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
