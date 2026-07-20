import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { EthChatComponent } from './eth-chat.component';

describe('EthChatComponent', () => {
  let component: EthChatComponent;
  let fixture: ComponentFixture<EthChatComponent>;
  let translateMock: jasmine.SpyObj<TranslateService>;
  let onLangChange$: Subject<any>;

  beforeEach(async () => {
    onLangChange$ = new Subject<any>();
    translateMock = {
      onLangChange: onLangChange$,
      currentLang: 'de'
    } as unknown as jasmine.SpyObj<TranslateService>;

    await TestBed.configureTestingModule({
      imports: [EthChatComponent],
      providers: [
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
