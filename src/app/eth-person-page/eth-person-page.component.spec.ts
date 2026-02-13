import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, Subject, of, take } from 'rxjs';
import { EthPersonPageComponent } from './eth-person-page.component';
import { EthPersonService } from '../services/eth-person.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from '../injection-tokens';

const createPersonResponse = () => ({
  gnd: ['g1'],
  wiki: { label: 'Wiki Name', birth: '1900-01-01' },
  entityfacts: { preferredName: 'Entity Name' }
});

describe('EthPersonPageComponent', () => {
  let component: EthPersonPageComponent;
  let fixture: ComponentFixture<EthPersonPageComponent>;
  let linkedDataEntityId$: BehaviorSubject<string>;
  let linkedDataEntityStatus$: BehaviorSubject<string>;

  let personService: jasmine.SpyObj<EthPersonService>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let translateService: { currentLang: string; onLangChange: Subject<{ lang: string }>; stream: (key: string) => Observable<string> };
  let router: { url: string; navigateByUrl: jasmine.Spy };

  beforeEach(async () => {
    linkedDataEntityId$ = new BehaviorSubject<string>('ID1');
    linkedDataEntityStatus$ = new BehaviorSubject<string>('error');

    personService = jasmine.createSpyObj<EthPersonService>('EthPersonService', [
      'getPerson',
      'processPersonsResponse',
      'searchPrimoData',
      'getProviderLabel'
    ]);
    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getTab',
      'getScope',
      'getVid'
    ], {
      linkedDataEntityId$: linkedDataEntityId$.asObservable(),
      linkedDataEntityStatus$: linkedDataEntityStatus$.asObservable()
    });
    errorHandlingService = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logSyncError',
      'logError'
    ]);
    translateService = {
      currentLang: 'de',
      onLangChange: new Subject<{ lang: string }>(),
      stream: (key: string) => of(key)
    };
    router = { url: '/entity/person', navigateByUrl: jasmine.createSpy('navigateByUrl') };

    storeService.getTab.and.returnValue('TAB');
    storeService.getScope.and.returnValue('SCOPE');
    storeService.getVid.and.returnValue('VID');

    await TestBed.configureTestingModule({
      imports: [EthPersonPageComponent, NoopAnimationsModule],
      providers: [
        { provide: EthPersonService, useValue: personService },
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingService },
        { provide: TranslateService, useValue: translateService },
        { provide: SHELL_ROUTER, useValue: router }
      ]
    })
    .compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(EthPersonPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };


  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });


  it('returns null when page is not a person entity page', (done) => {
    router.url = '/search';
    createComponent();

    component.person$.pipe(take(1)).subscribe(person => {
      expect(person).toBeNull();
      expect(personService.getPerson).not.toHaveBeenCalled();
      done();
    });
  });


  it('loads person and builds search variants', (done) => {
    personService.getPerson.and.returnValue(of(createPersonResponse() as any));
    personService.processPersonsResponse.and.returnValue({
      name: 'Entity Name',
      gnd: 'g1',
      wiki: { label: 'Wiki Name', birth: '1900-01-01' },
      entityfacts: { preferredName: 'Entity Name' }
    } as any);
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 1 } } as any));

    createComponent();

    component.person$.pipe(take(1)).subscribe(person => {
      expect(person?.label).toBe('Entity Name');
      expect(person?.yearOfBirth).toBe('1900');
      expect(person?.searchVariants?.length).toBe(3);
      done();
    });
  });


  it('renders person header in the template', (done) => {
    personService.getPerson.and.returnValue(of(createPersonResponse() as any));
    personService.processPersonsResponse.and.returnValue({
      name: 'Entity Name',
      gnd: 'g1',
      wiki: { label: 'Wiki Name', birth: '1900-01-01' },
      entityfacts: { preferredName: 'Entity Name' },
      searchVariants: []
    } as any);
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 1 } } as any));

    createComponent();
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('.eth-expansion-panel-header h2'));
      expect(header).toBeTruthy();
      expect((header.nativeElement as HTMLElement).textContent).toContain('Entity Name');
      done();
    });
  });


  it('reloads person on language change', (done) => {
    personService.getPerson.and.returnValue(of(createPersonResponse() as any));
    personService.processPersonsResponse.and.returnValue({
      name: 'Entity Name',
      gnd: 'g1',
      wiki: { label: 'Wiki Name', birth: '1900-01-01' },
      entityfacts: { preferredName: 'Entity Name' }
    } as any);
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 1 } } as any));

    createComponent();

    let emissions = 0;
    component.person$.pipe(take(2)).subscribe(() => {
      emissions += 1;
      if (emissions === 2) {
        const langs = personService.getPerson.calls.allArgs().map(args => args[1]);
        expect(langs).toContain('de');
        expect(langs).toContain('en');
        done();
      }
    });

    translateService.currentLang = 'en';
    translateService.onLangChange.next({ lang: 'en' });
  });


  it('uses entityfacts name or (if no entityfacts name) wikidata name', (done) => {
    personService.getPerson.and.returnValue(of({
      gnd: ['g1'],
      wiki: { label: 'Wiki Name', birth: '1900-01-01' },
      entityfacts: {}
    } as any));
    personService.processPersonsResponse.and.returnValue({
      gnd: 'g1',
      wiki: { label: 'Wiki Name', birth: '1900-01-01' },
      entityfacts: {}
    } as any);
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 1 } } as any));

    createComponent();

    component.person$.pipe(take(1)).subscribe(person => {
      expect(person?.label).toBe('Wiki Name');
      done();
    });
  });
});
