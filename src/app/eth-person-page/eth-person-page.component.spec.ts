import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, Subject, of, take, throwError, firstValueFrom } from 'rxjs';
import { EthPersonPageComponent } from './eth-person-page.component';
import { EthPersonService } from '../services/eth-person.service';
import { EthStoreService } from '../services/eth-store.service';
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
      'logError',
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

    createComponent();

    component.person$.pipe(take(1)).subscribe(person => {
      expect(person?.label).toBe('Wiki Name');
      done();
    });
  });


  it('returns null and logs when person loading fails', (done) => {
    personService.getPerson.and.returnValue(throwError(() => new Error('boom')));
    personService.processPersonsResponse.and.stub();

    createComponent();

    component.person$.pipe(take(1)).subscribe(person => {
      expect(person).toBeNull();
      expect(errorHandlingService.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthPersonPageComponent.loadPerson');
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


  it('builds precision recall links with gnd and birthyear combinations', () => {
    createComponent({ detectChanges: false });
    const person: any = { label: 'Entity Name', gnd: 'GND123', yearOfBirth: '1900' };
    (component as any).lang = 'de';

    const result = component.addPrecisionRecallLinks(person);

    const urls = result.searchVariants ?? [];
    expect(urls.length).toBe(3);
    expect(urls[0]).toContain('query=Entity%20Name&');
    expect(urls[1]).toContain('mode=advanced');
    expect(urls[2]).toContain(`query=${encodeURIComponent('Entity Name AND (1900 OR GND123)')}`);
  });


  it('adds precision recall query with year when gnd is missing', () => {
    createComponent({ detectChanges: false });
    const person: any = { label: 'Entity Name', yearOfBirth: '1950' };
    (component as any).lang = 'de';

    const result = component.addPrecisionRecallLinks(person);

    expect(result.searchVariants?.length).toBe(2);
    expect(result.searchVariants?.[1]).toContain(`query=${encodeURIComponent('Entity Name 1950')}`);
  });


  it('adds precision recall query with gnd when year is missing', () => {
    createComponent({ detectChanges: false });
    const person: any = { label: 'Entity Name', gnd: 'GND123' };
    (component as any).lang = 'de';

    const result = component.addPrecisionRecallLinks(person);

    expect(result.searchVariants?.length).toBe(3);
    expect(result.searchVariants?.[2]).toContain(`query=${encodeURIComponent('Entity Name GND123')}`);
  });


  it('builds advanced search link for authority queries', () => {
    createComponent({ detectChanges: false });
    (component as any).lang = 'de';
    storeService.getTab.and.returnValue(undefined as any);
    storeService.getScope.and.returnValue(undefined as any);
    storeService.getVid.and.returnValue(undefined as any);

    const url = component.getSearchLink('lds03,contains,GND123');

    expect(url).toContain('mode=advanced');
    expect(url).toContain('query=lds03%2Ccontains%2CGND123');
  });


  it('trims any,contains prefix for normal searches', () => {
    createComponent({ detectChanges: false });
    (component as any).lang = 'de';

    const url = component.getSearchLink('any,contains,Entity Name');

    expect(url).toContain('query=Entity%20Name');
    expect(url).not.toContain('mode=advanced');
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
    fixture.detectChanges();
    tick();
    expect(component.isOpen('details')).toBeTrue();
    expect(component.licensePopover?.nativeElement.focus).toHaveBeenCalled();

    component.close();
    fixture.detectChanges();
    tick();
    expect(component.isOpen('details')).toBeFalse();
    expect(component.licensePopoverTrigger?.nativeElement.focus).toHaveBeenCalled();

    component.toggle('details');
    fixture.detectChanges();
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
