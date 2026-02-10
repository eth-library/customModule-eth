import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subject, of, take } from 'rxjs';
import { EthPersonCardsComponent } from './eth-person-cards.component';
import { EthPersonService } from '../../services/eth-person.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { SHELL_ROUTER } from '../../injection-tokens';
import { PnxDoc } from '../../models/eth.model';

describe('EthPersonCardsComponent', () => {
  let component: EthPersonCardsComponent;
  let fixture: ComponentFixture<EthPersonCardsComponent>;
  let record$: Subject<PnxDoc>;
  let linkedDataRecommendations$: BehaviorSubject<any[]>;

  let ethPersonService: jasmine.SpyObj<EthPersonService>;
  let translateService: { currentLang: string; onLangChange: Subject<{ lang: string }>; stream: (key: string) => Observable<string> };
  let ethStoreService: { getRecord$: (host: any) => Observable<PnxDoc>; linkedDataRecommendations$: Observable<any[]> };
  let ethErrorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(async () => {
    record$ = new Subject<PnxDoc>();
    linkedDataRecommendations$ = new BehaviorSubject<any[]>([]);

    ethPersonService = jasmine.createSpyObj<EthPersonService>('EthPersonService', [
      'getGndByIdRef',
      'getPersons',
      'processPersonsResponse'
    ]);

    translateService = {
      currentLang: 'de',
      onLangChange: new Subject<{ lang: string }>(),
      stream: (key: string) => of(key)
    };

    ethStoreService = {
      getRecord$: () => record$.asObservable(),
      linkedDataRecommendations$: linkedDataRecommendations$.asObservable()
    };

    ethErrorHandlingService = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError',
      'logSyncError'
    ]);

    await TestBed.configureTestingModule({
      imports: [EthPersonCardsComponent],
      providers: [
        { provide: EthPersonService, useValue: ethPersonService },
        { provide: TranslateService, useValue: translateService },
        { provide: EthStoreService, useValue: ethStoreService },
        { provide: EthErrorHandlingService, useValue: ethErrorHandlingService },
        { provide: SHELL_ROUTER, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthPersonCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('loads persons and filters persons with already rendered otb cards', (done) => {
    component.hostComponent = {};

    const response = {
      gnd: ['123', '999'],
      results: [
        { gnd: '123' },
        { gnd: '999' }
      ]
    } as any;

    ethPersonService.getGndByIdRef.and.returnValue(of('999'));
    ethPersonService.getPersons.and.returnValue(of(response));
    ethPersonService.processPersonsResponse.and.callFake((payload: any) => {
      const gnd = payload.gnd?.[0];
      if (gnd === '123') {
        return { entityfacts: { preferredName: 'Name A', lccn: 'L1' } } as any;
      }
      return { wiki: { label: 'Name B', loc: 'L2' } } as any;
    });

    linkedDataRecommendations$.next([{ id: 'L2' }]);

    component.persons$.pipe(take(1)).subscribe(result => {
      expect(result?.otbPersons.length).toBe(1);
      expect(result?.filteredPersons.length).toBe(1);
      expect(ethPersonService.getPersons).toHaveBeenCalledWith('123,999', 'de');
      done();
    });

    record$.next({ pnx: { display: { lds03: [
      'GND: Test: 123',
      'https://www.idref.fr/12345'
    ] } } } as PnxDoc);
  });


  it('skips person loading when no ids exist', (done) => {
    component.hostComponent = {};

    component.persons$.pipe(take(1)).subscribe(result => {
      expect(result?.filteredPersons.length).toBe(0);
      expect(ethPersonService.getPersons).not.toHaveBeenCalled();
      done();
    });

    record$.next({ pnx: { display: { lds03: [] } } } as PnxDoc);
  });


  it('reloads persons on language change', (done) => {
    component.hostComponent = {};

    ethPersonService.getPersons.and.returnValue(of({ gnd: [], results: [] } as any));
    ethPersonService.getGndByIdRef.and.returnValue(of(null));

    let emissions = 0;
    component.persons$.pipe(take(2)).subscribe(() => {
      emissions += 1;
      if (emissions === 2) {
        const langs = ethPersonService.getPersons.calls.allArgs().map(args => args[1]);
        expect(ethPersonService.getPersons.calls.count()).toBeGreaterThanOrEqual(2);
        expect(langs).toContain('de');
        expect(langs).toContain('en');
        done();
      }
    });
    
    record$.next({ pnx: { display: { lds03: ['GND: Test: 123'] } } } as PnxDoc);
    translateService.currentLang = 'en';
    translateService.onLangChange.next({ lang: 'en' });
  });


  it('renders person cards in the template', (done) => {
    component.hostComponent = {};

    const response = {
      gnd: ['123'],
      results: [{ gnd: '123' }]
    } as any;

    ethPersonService.getGndByIdRef.and.returnValue(of(null));
    ethPersonService.getPersons.and.returnValue(of(response));
    ethPersonService.processPersonsResponse.and.returnValue({
      name: 'Name A',
      url: '/entity/person/123',
      entityfacts: { preferredName: 'Name A', lccn: 'L1' }
    } as any);

    linkedDataRecommendations$.next([]);

    record$.next({ pnx: { display: { lds03: ['GND: Test: 123'] } } } as PnxDoc);

    fixture.detectChanges();
    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.eth-person-cards'));
      const cardTitle = fixture.debugElement.query(By.css('.eth-person-card h5 a'));

      expect(container).toBeTruthy();
      expect(cardTitle).toBeTruthy();
      expect((cardTitle.nativeElement as HTMLElement).textContent).toContain('Name A');
      done();
    });
  });
});
