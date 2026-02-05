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
    stream: (key: string) => of(key)
  };

  // BehaviorSubjects for StoreService
  let userGroup$: BehaviorSubject<string | null>;
  let email$: BehaviorSubject<string | null>;
  let authenticationProfile$: BehaviorSubject<string | null>;
  let storeServiceMock: any;

  beforeEach(async () => {
    // prepare BehaviorSubjects
    userGroup$ = new BehaviorSubject<string | null>('ETH_Student');
    email$ = new BehaviorSubject<string | null>('student.bla@ethz.ch');
    authenticationProfile$ = new BehaviorSubject<string | null>('Alma');

    // StoreService Mock
    storeServiceMock = {
      userGroup$: userGroup$.asObservable(),
      email$: email$.asObservable(),
      authenticationProfile$: authenticationProfile$.asObservable()
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


  it('showWarning$ emits false because of Profile', async () => {
    userGroup$.next('ETH_Student');
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Alma');

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeFalse();
  });


  it('showWarning$ emits true because of: no eth userGroup, but eth mail', async () => {
    userGroup$.next('AnyOther');
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Other');

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeTrue();
  });
  

  it('showWarning$ emits false because of: no eth userGroup, no eth email', async () => {
    userGroup$.next('AnyOther');
    email$.next('bla@gmx.ch');
    authenticationProfile$.next('Other');

    const result = await firstValueFrom(component.showWarning$);
    expect(result).toBeFalse();
  });


  /*it('should render warning', async () => {
    userGroup$.next('AnyOther');
    email$.next('student.bla@ethz.ch');
    authenticationProfile$.next('Other');
    
    const compiled = fixture.nativeElement as HTMLElement;

    const firstLink = compiled.querySelector('a[aria-label*="eth.idpWarning.linkText1"]');
    console.log(compiled)
    expect(firstLink?.textContent).toContain('eth.idpWarning.linkText1');

    const secLink = compiled.querySelector('a[aria-label^="eth.idpWarning.linkText2"]');
    expect(secLink?.textContent).toContain('eth.idpWarning.linkText2');
  });*/


});
