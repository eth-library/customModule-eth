import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Observable, Subject, of, take, throwError } from 'rxjs';
import { EthPersonCardsComponent } from './eth-person-cards.component';
import { EthPersonService } from '../../services/eth-person.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from '../../services/eth-store.service';
import { SHELL_ROUTER } from '../../injection-tokens';
import { PnxDoc, PersonVM } from '../../models/eth.model';

describe('EthPersonCardsComponent', () => {
  let component: EthPersonCardsComponent;
  let fixture: ComponentFixture<EthPersonCardsComponent>;
  let record$: Subject<PnxDoc>;
  let linkedDataRecommendations$: BehaviorSubject<any[]>;

  let ethPersonService: jasmine.SpyObj<EthPersonService>;
  let translateService: { currentLang: string; onLangChange: Subject<{ lang: string }>; stream: (key: string) => Observable<string> };
  let ethStoreService: { getRecord$: jasmine.Spy; linkedDataRecommendations$: Observable<any[]> };
  let ethErrorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let routerMock: { navigateByUrl: jasmine.Spy };

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
      getRecord$: jasmine.createSpy('getRecord$').and.callFake(() => record$.asObservable()),
      linkedDataRecommendations$: linkedDataRecommendations$.asObservable()
    };

    ethErrorHandlingService = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError',
      'logError'
    ]);

    routerMock = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    await TestBed.configureTestingModule({
      imports: [EthPersonCardsComponent],
      providers: [
        { provide: EthPersonService, useValue: ethPersonService },
        { provide: TranslateService, useValue: translateService },
        { provide: EthStoreService, useValue: ethStoreService },
        { provide: EthErrorHandlingService, useValue: ethErrorHandlingService },
        { provide: SHELL_ROUTER, useValue: routerMock }
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


  it('no person loading when no ids exist', (done) => {
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


  it('emits empty person cards when persons$ pipeline errors', (done) => {
    component.hostComponent = {};
    ethStoreService.getRecord$.and.returnValue(throwError(() => new Error('store fail')));

    component.persons$.pipe(take(1)).subscribe(result => {
      expect(result).toEqual({ otbPersons: [], filteredPersons: [] });
      expect(ethErrorHandlingService.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthPersonCardsComponent persons$');
      done();
    });
  });


  it('logs errors when loadPersons fails', (done) => {
    component.hostComponent = {};
    ethStoreService.getRecord$.and.returnValue(of({ pnx: { display: { lds03: ['GND: Test: 123'] } } } as PnxDoc));
    ethPersonService.getGndByIdRef.and.returnValue(of(null));
    ethPersonService.getPersons.and.returnValue(throwError(() => new Error('load fail')));

    component.persons$.pipe(take(1)).subscribe(result => {
      expect(result?.filteredPersons).toEqual([]);
      expect(ethErrorHandlingService.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthPersonCardsComponent.loadPersons');
      done();
    });
  });

  it('keeps persons without identifiers when filtering', () => {
    const persons: PersonVM[] = [{ entityfacts: { preferredName: 'Name' } } as any];
    const entities = [{ id: 'L1' }];

    const result = (component as any).filterPersons(persons, entities);

    expect(result.filteredPersons.length).toBe(1);
    expect(result.filteredPersons[0].entityfacts?.preferredName).toBe('Name');
  });

  it('parses gnd ids with Alma links', () => {
    const record = {
      pnx: {
        display: {
          lds03: ['GND: <a href="https://explore.gnd.network/gnd/118527908">Name</a>']
        }
      }
    } as PnxDoc;

    const ids = (component as any).getGndIds(record);

    expect(ids).toEqual(['118527908']);
  });

  it('parses gnd ids from plain GND URLs', () => {
    const record = {
      pnx: {
        display: {
          lds03: ['https://explore.gnd.network/gnd/118527908']
        }
      }
    } as PnxDoc;

    const ids = (component as any).getGndIds(record);

    expect(ids).toEqual(['118527908']);
  });

  it('navigates via router when navigate is called', () => {
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate('/entity/person/123', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/entity/person/123#eth-top');
  });

  it('handles license popover open and close helpers', fakeAsync(() => {
    const popover = document.createElement('div');
    popover.id = component.getLicensePopoverId('license');
    document.body.appendChild(popover);
    const focusSpy = spyOn(popover, 'focus');

    const trigger = document.createElement('button');
    trigger.setAttribute('data-license-trigger', 'license');
    document.body.appendChild(trigger);
    const triggerFocusSpy = spyOn(trigger, 'focus');

    try {
      component.open('license');
      tick();
      expect(component.isOpen('license')).toBeTrue();
      expect(focusSpy).toHaveBeenCalled();

      component.close();
      tick();
      expect(component.isOpen('license')).toBeFalse();
      expect(triggerFocusSpy).toHaveBeenCalled();
    } finally {
      popover.remove();
      trigger.remove();
    }
  }));

  it('toggles popover state', () => {
    component.toggle('license');
    expect(component.isOpen('license')).toBeTrue();

    component.toggle('license');
    expect(component.isOpen('license')).toBeFalse();
  });

  it('closes popover when focus leaves element', () => {
    const popover = document.createElement('div');
    popover.id = component.getLicensePopoverId('license');
    document.body.appendChild(popover);

    const outside = document.createElement('button');
    document.body.appendChild(outside);

    component.openLicensePopover = 'license';

    try {
      component.onFocusOut({ relatedTarget: outside } as unknown as FocusEvent);

      expect(component.isOpen('license')).toBeFalse();
    } finally {
      popover.remove();
      outside.remove();
    }
  });
});
