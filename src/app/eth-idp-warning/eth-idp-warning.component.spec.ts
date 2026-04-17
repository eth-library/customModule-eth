import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { EthIdpWarningComponent } from './eth-idp-warning.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

describe('EthIdpWarningComponent', () => {
  let component: EthIdpWarningComponent;
  let fixture: ComponentFixture<EthIdpWarningComponent>;

  // Mocks
  const translateMock = {
    currentLang: 'de',
    get: (key: string) => of(key),
    stream: (key: string) => of(key),
    getParsedResult: (translations: any, key: string) => {
      if (!translations) return key;
      return translations[key] ?? key;
    },
    onLangChange: of({ lang: 'de', translations: {} }),
    onTranslationChange: of({ lang: 'de', translations: {} }),
    onDefaultLangChange: of({ lang: 'de' })
  };

  // BehaviorSubjects for StoreService
  let email$: BehaviorSubject<string | null>;
  let authenticationProfile$: BehaviorSubject<string | null>;
  let isLoggedIn$: BehaviorSubject<boolean>;
  let isEthMember$: BehaviorSubject<boolean>;
  let storeServiceMock: any;
  let isEthMemberSpy: jasmine.Spy;

  
  beforeEach(async () => {
    // prepare BehaviorSubjects
    email$ = new BehaviorSubject<string | null>('student.bla@ethz.ch');
    authenticationProfile$ = new BehaviorSubject<string | null>('Alma');
    isLoggedIn$ = new BehaviorSubject<boolean>(true);
    isEthMember$ = new BehaviorSubject<boolean>(true);
    isEthMemberSpy = jasmine.createSpy('isEthMember').and.returnValue(isEthMember$.asObservable());

    // StoreService Mock
    storeServiceMock = {
      email$: email$.asObservable(),
      authenticationProfile$: authenticationProfile$.asObservable(),
      isLoggedIn$: isLoggedIn$.asObservable(),
      isEthMember: isEthMemberSpy
    };

    // TestBed Setup
    await TestBed.configureTestingModule({
      imports: [
        EthIdpWarningComponent
      ],
      providers: [
        { provide: TranslateService, useValue: translateMock },
        { provide: EthStoreService, useValue: storeServiceMock },
        { provide: EthErrorHandlingService, useValue: { logError: () => {} } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthIdpWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('no warning because of Profile "Alma" (institutional account)', async () => {
    isEthMember$.next(true);
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Alma');

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeFalse();
  });


  it('warning because of: no eth userGroup, but eth email', async () => {
    isEthMember$.next(false);
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Other');

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeTrue();
  });


  it('no warning when user is not logged in', async () => {
    isEthMember$.next(false);
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Other');
    isLoggedIn$.next(false);

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeFalse();
  });
  

  it('no warning because of: no eth userGroup, no eth email', async () => {
    isEthMember$.next(false);
    email$.next('bla@gmx.ch');
    authenticationProfile$.next('Other');

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeFalse();
  });


  it('should render warning', async () => {
    isEthMember$.next(false);
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Other');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled).toBeTruthy();

    const warning = compiled.querySelector('.eth-idp-warning');
    expect(warning).toBeTruthy();

    const links = warning?.querySelectorAll('a');
    expect(links?.length).toBe(2);
    expect(links?.[0].textContent).toContain('eth.idpWarning.linkText1');
    expect(links?.[1].textContent).toContain('eth.idpWarning.linkText2');
  });
});
