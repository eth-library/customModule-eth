import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthGitHintComponent } from './eth-git-hint.component';

describe('EthGitHintComponent', () => {
  let component: EthGitHintComponent;
  let fixture: ComponentFixture<EthGitHintComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthGitHintComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthGitHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
