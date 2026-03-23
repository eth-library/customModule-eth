import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, Subject, of, take, throwError, firstValueFrom } from 'rxjs';
import { EthPersonPageComponent } from './eth-person-page.component';
import { EthPersonService } from '../services/eth-person.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { DOCUMENT } from '@angular/common';
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
  let linkedDataEntityStatus$: Subject<string>;

  let personService: jasmine.SpyObj<EthPersonService>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let translateService: { currentLang: string; onLangChange: Subject<{ lang: string }>; stream: (key: string) => Observable<string> };
  let router: { url: string; navigateByUrl: jasmine.Spy };
  let documentRef: Document;

  beforeEach(async () => {
    linkedDataEntityId$ = new BehaviorSubject<string>('ID1');
    linkedDataEntityStatus$ = new Subject<string>();

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

    documentRef = TestBed.inject(DOCUMENT);
  });

  const createComponent = (options?: { detectChanges?: boolean }) => {
    fixture = TestBed.createComponent(EthPersonPageComponent);
    component = fixture.componentInstance;
    if (options?.detectChanges === false) {
      return;
    }
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


  it('returns null and logs when person loading fails', (done) => {
    personService.getPerson.and.returnValue(throwError(() => new Error('boom')));
    personService.processPersonsResponse.and.stub();
    personService.searchPrimoData.and.stub();

    createComponent();

    component.person$.pipe(take(1)).subscribe(person => {
      expect(person).toBeNull();
      expect(errorHandlingService.logSyncError).toHaveBeenCalledWith(jasmine.any(Error), 'EthPersonPageComponent.loadPerson');
      done();
    });
  });


  it('falls back to german when current language is empty', (done) => {
    translateService.currentLang = '';
    personService.getPerson.and.returnValue(of(createPersonResponse() as any));
    personService.processPersonsResponse.and.returnValue({
      entityfacts: { preferredName: 'Entity Name' },
      wiki: {}
    } as any);
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 0 } } as any));

    createComponent({ detectChanges: false });

    component.person$.pipe(take(1)).subscribe(() => {
      expect(personService.getPerson).toHaveBeenCalledWith('ID1', 'de');
      done();
    });
  });


  it('emits success when otbEntityStatus$ stream errors', (done) => {
    createComponent();

    component.otbEntityStatus$.subscribe(value => {
      expect(value).toBe('success');
      done();
    });

    linkedDataEntityStatus$.error(new Error('fail'));
  });


  it('builds precision recall links with gnd and birthyear combinations', (done) => {
    createComponent({ detectChanges: false });
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 5 } } as any));
    const person: any = { label: 'Entity Name', gnd: 'GND123', yearOfBirth: '1900' };
    (component as any).lang = 'de';

    component.getPrecisionRecallLinks(person).subscribe(result => {
      expect(result.searchVariants?.length).toBe(3);
      const urls = result.searchVariants?.map(v => v.url) ?? [];
      expect(urls[0]).toContain('query=Entity Name');
      expect(urls.some(url => url.includes('mode=advanced'))).toBeTrue();
      done();
    });
  });


  it('adds precision recall query with year when gnd is missing', (done) => {
    createComponent({ detectChanges: false });
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 0 } } as any));
    const person: any = { label: 'Entity Name', yearOfBirth: '1950' };
    (component as any).lang = 'de';

    component.getPrecisionRecallLinks(person).subscribe(() => {
      const queries = personService.searchPrimoData.calls.allArgs().map(args => args[0]);
      expect(queries).toContain('any,contains,Entity Name 1950');
      done();
    });
  });


  it('adds precision recall query with gnd when year is missing', (done) => {
    createComponent({ detectChanges: false });
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 0 } } as any));
    const person: any = { label: 'Entity Name', gnd: 'GND123' };
    (component as any).lang = 'de';

    component.getPrecisionRecallLinks(person).subscribe(() => {
      const queries = personService.searchPrimoData.calls.allArgs().map(args => args[0]);
      expect(queries).toContain('any,contains,Entity Name GND123');
      done();
    });
  });


  it('builds advanced search link for authority queries', (done) => {
    createComponent({ detectChanges: false });
    (component as any).lang = 'de';
    storeService.getTab.and.returnValue(undefined as any);
    storeService.getScope.and.returnValue(undefined as any);
    storeService.getVid.and.returnValue(undefined as any);
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 2 } } as any));

    component.getSearchLink('lds03,contains,GND123').pipe(take(1)).subscribe(link => {
      expect(link?.url).toContain('mode=advanced');
      expect(link?.url).toContain('query=lds03,contains,GND123');
      done();
    });
  });


  it('trims any,contains prefix for normal searches', (done) => {
    createComponent({ detectChanges: false });
    (component as any).lang = 'de';
    personService.searchPrimoData.and.returnValue(of({ info: { totalResultsLocal: 1 } } as any));

    component.getSearchLink('any,contains,Entity Name').pipe(take(1)).subscribe(link => {
      expect(link?.url).toContain('query=Entity Name');
      expect(link?.url).not.toContain('mode=advanced');
      done();
    });
  });


  it('logs errors when search link lookup fails', (done) => {
    createComponent({ detectChanges: false });
    (component as any).lang = 'de';
    personService.searchPrimoData.and.returnValue(throwError(() => new Error('fail')));
    errorHandlingService.logError.calls.reset();

    component.getSearchLink('any,contains,Entity Name').pipe(take(1)).subscribe(link => {
      expect(link).toBeNull();
      expect(errorHandlingService.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthPersonPageComponent.getSearchLink');
      done();
    });
  });


  it('navigates via router for internal links', () => {
    createComponent();
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate('/foo', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/foo');
  });


  it('manages license popover focus correctly', fakeAsync(() => {
    createComponent();
    component.licensePopover = { nativeElement: { focus: jasmine.createSpy('focus') } } as any;
    component.licensePopoverTrigger = { nativeElement: { focus: jasmine.createSpy('triggerFocus') } } as any;

    component.open('details');
    tick();
    expect(component.isOpen('details')).toBeTrue();
    expect(component.licensePopover?.nativeElement.focus).toHaveBeenCalled();

    component.close();
    tick();
    expect(component.isOpen('details')).toBeFalse();
    expect(component.licensePopoverTrigger?.nativeElement.focus).toHaveBeenCalled();

    component.toggle('details');
    tick();
    expect(component.isOpen('details')).toBeTrue();
  }));


  it('closes the popover when focus leaves the element', () => {
    createComponent();
    component.licensePopover = { nativeElement: { contains: () => false } } as any;
    spyOn(component as any, 'close');
    spyOn(console, 'error');

    component.onFocusOut({ relatedTarget: null } as FocusEvent);

    expect((component as any).close).toHaveBeenCalled();
  });


  it('keeps popover open when focus stays inside', () => {
    createComponent();
    const inside = document.createElement('button');
    component.licensePopover = { nativeElement: { contains: () => true } } as any;
    spyOn(component as any, 'close');
    spyOn(console, 'error');

    component.onFocusOut({ relatedTarget: inside } as unknown as FocusEvent);

    expect((component as any).close).not.toHaveBeenCalled();
  });


  it('reassigns panel ids for accessibility', () => {
    createComponent();
    const wrapper = documentRef.createElement('div');
    wrapper.classList.add('eth-personpage-links');
    const panel = documentRef.createElement('mat-expansion-panel');
    const header = documentRef.createElement('mat-expansion-panel-header');
    const content = documentRef.createElement('div');
    content.classList.add('mat-expansion-panel-content');
    panel.appendChild(header);
    panel.appendChild(content);
    wrapper.appendChild(panel);
    documentRef.body.appendChild(wrapper);

    component.resetPanelIds();

    expect(header.id).toContain('mat-expansion-panel-header-');
    expect(header.getAttribute('aria-controls')).toContain('cdk-accordion-child-');
    expect(content.id).toContain('cdk-accordion-child-');
    expect(content.getAttribute('aria-labelledby')).toBe(header.id);

    documentRef.body.removeChild(wrapper);
  });
});
