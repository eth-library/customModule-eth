import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthBibNewsComponent } from './eth-bib-news.component';

describe('EthBibNewsComponent', () => {
  let component: EthBibNewsComponent;
  let fixture: ComponentFixture<EthBibNewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EthBibNewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthBibNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
