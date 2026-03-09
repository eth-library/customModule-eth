import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, Subject, of, take, throwError } from 'rxjs';
import { EthLocationPageComponent } from './eth-location-page.component';
import { EthLocationPageService } from './eth-location-page.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from '../injection-tokens';
import { PlacePageViewModel } from '../models/eth.model';

const wikidataResponse = {
  results: {
    bindings: [
      {
        itemLabel: { value: 'Zurich' },
        itemDescription: { value: 'City' },
        item: { value: 'https://www.wikidata.org/entity/Q72' }
      }
    ]
  }
};

describe('EthLocationPageComponent', () => {
  let component: EthLocationPageComponent;
  let fixture: ComponentFixture<EthLocationPageComponent>;
  let linkedDataEntityId$: BehaviorSubject<string>;
  let linkedDataEntityStatus$: Subject<string>;

  let locationService: jasmine.SpyObj<EthLocationPageService>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let translateService: { currentLang: string; onLangChange: Subject<{ lang: string }>; stream: (key: string) => Observable<string> };
  let router: { url: string; navigateByUrl: jasmine.Spy };

  beforeEach(async () => {
    linkedDataEntityId$ = new BehaviorSubject<string>('Q72');
    linkedDataEntityStatus$ = new Subject<string>();

    locationService = jasmine.createSpyObj<EthLocationPageService>('EthLocationPageService', [
      'getIdentifierForLccn',
      'getTopicsFromGeoGraph',
      'getPoiFromGeoGraph',
      'getPlaceFromETHorama',
      'getPlaceFromWikidata',
      'getMapsFromGeoGraph'
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
      'logError'
    ]);
    translateService = {
      currentLang: 'de',
      onLangChange: new Subject<{ lang: string }>(),
      stream: (key: string) => of(key)
    };
    router = { url: '/entity/location', navigateByUrl: jasmine.createSpy('navigateByUrl') };

    storeService.getTab.and.returnValue('TAB');
    storeService.getScope.and.returnValue('SCOPE');
    storeService.getVid.and.returnValue('VID');

    locationService.getTopicsFromGeoGraph.and.returnValue(of({ features: [] } as any));
    locationService.getPoiFromGeoGraph.and.returnValue(of({ features: [] } as any));
    locationService.getPlaceFromETHorama.and.returnValue(of({ items: [] } as any));
    locationService.getPlaceFromWikidata.and.returnValue(of(wikidataResponse as any));
    locationService.getMapsFromGeoGraph.and.returnValue(of({ features: [] } as any));

    await TestBed.configureTestingModule({
      imports: [EthLocationPageComponent, NoopAnimationsModule],
      providers: [
        { provide: EthLocationPageService, useValue: locationService },
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingService },
        { provide: TranslateService, useValue: translateService },
        { provide: SHELL_ROUTER, useValue: router }
      ]
    })
    .compileComponents();
  });

  const createComponent = () => {
    fixture = TestBed.createComponent(EthLocationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };


  it('should create', () => {
    createComponent();
    expect(component).toBeTruthy();
  });


  it('returns null when page is not an location entity page', (done) => {
    router.url = '/search';
    createComponent();

    component.placePageData$.pipe(take(1)).subscribe(data => {
      expect(data).toBeNull();
      done();
    });
  });


  it('loads place data for QID entity', (done) => {
    createComponent();

    component.placePageData$.pipe(take(1)).subscribe(data => {
      if (data) {
        expect(data.wikidata?.name).toBe('Zurich');
        done();
      }
    });
  });


  it('renders wikidata name in the template', (done) => {
    createComponent();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const header = fixture.debugElement.query(By.css('.eth-expansion-panel-header h2'));
      expect(header).toBeTruthy();
      expect((header.nativeElement as HTMLElement).textContent).toContain('Zurich');
      done();
    });
  });


  it('resolves lccn to qid', (done) => {
    createComponent();

    locationService.getIdentifierForLccn.and.returnValue(of({
      results: { bindings: [{ qid: { value: 'Q123' } }] }
    } as any));

    (component as any).resolveEntityId('no2002070963').subscribe((qid: string) => {
      expect(qid).toBe('Q123');
      done();
    });
  });


  it('ethorama links when ethorama items are returned', (done) => {
    locationService.getPlaceFromETHorama.and.returnValue(of({
      items: [{ id: '1', name: { de: 'Ort', en: 'Place' } }]
    } as any));
    locationService.getPlaceFromWikidata.and.returnValue(of({
      results: { bindings: [{ itemLabel: { value: 'Zurich' }, item: { value: 'Q72' } }] }
    } as any));

    createComponent();

    component.placePageData$.pipe(take(1)).subscribe(data => {
      if (data) {
        expect(data.ethorama?.links?.length).toBe(1);
        expect(data.ethorama?.links?.[0].text).toBe('Ort');
        done();
      }
    });
  });


  it('maps topics when geo topics are returned', (done) => {
    locationService.getTopicsFromGeoGraph.and.returnValue(of({
      features: [
        { properties: { name: 'Topic A', gnd: '123' } }
      ]
    } as any));
    locationService.getPlaceFromWikidata.and.returnValue(of({
      results: { bindings: [{ itemLabel: { value: 'Zurich' }, item: { value: 'Q72' } }] }
    } as any));

    createComponent();

    component.placePageData$.pipe(take(1)).subscribe(data => {
      if (data) {
        expect(data.topics?.length).toBe(1);
        expect(data.topics?.[0].name).toBe('Topic A');
        done();
      }
    });
  });


  it('extracts lat/lng and get maps', (done) => {
    locationService.getPlaceFromWikidata.and.returnValue(of({
      results: {
        bindings: [
          {
            itemLabel: { value: 'Zurich' },
            coordinate_location: { value: 'Point(8.55 47.37)' },
            item: { value: 'https://www.wikidata.org/entity/Q72' }
          }
        ]
      }
    } as any));
    locationService.getMapsFromGeoGraph.and.returnValue(of({ features: [] } as any));

    createComponent();
    (component as any).initMap = jasmine.createSpy('initMap');

    component.placePageData$.pipe(take(1)).subscribe(data => {
      if (data) {
        expect(locationService.getMapsFromGeoGraph).toHaveBeenCalledWith('47.37', '8.55');
        done();
      }
    });
  });


  it('logs errors and emits null when resolveEntityId fails', (done) => {
    createComponent();

    const expectedError = new Error('boom');
    spyOn<any>(component, 'resolveEntityId').and.returnValue(throwError(() => expectedError));

    component.placePageData$.pipe(take(1)).subscribe(value => {
      expect(value).toBeNull();
      expect(errorHandlingService.logError).toHaveBeenCalledWith(expectedError, 'EthLocationPageComponent.placePageData$');
      done();
    });

    linkedDataEntityId$.next('whatever');
  });


  it('falls back to success when otbEntityStatus stream errors', (done) => {
    createComponent();

    component.otbEntityStatus.subscribe(value => {
      expect(value).toBe('success');
      done();
    });

    linkedDataEntityStatus$.error('fail');
  });


  it('retrieves complete data for combined gnd and qid identifiers', (done) => {
    createComponent();
    component.lang = 'de';
    component.vid = 'VID';
    spyOn<any>(component, 'initMap');

    const qid = 'Q72';
    const gnd = '4639612-3';

    locationService.getTopicsFromGeoGraph.and.returnValue(of({
      features: [{ properties: { name: 'Topic', gnd: '123' } }]
    } as any));
    locationService.getPoiFromGeoGraph.and.returnValue(of({
      features: [{ properties: { dossiers: [{ id: 'd1', title_de: 'D', title_en: 'D EN' }], routes: [] } }]
    } as any));
    locationService.getPlaceFromETHorama.and.returnValue(of({
      items: [{ id: '1', name: { de: 'Ort' } }]
    } as any));
    locationService.getPlaceFromWikidata.and.returnValue(of({
      results: {
        bindings: [{
          itemLabel: { value: 'Zurich' },
          coordinate_location: { value: 'Point(8.55 47.37)' }
        }]
      }
    } as any));
    locationService.getMapsFromGeoGraph.and.returnValue(of({
      features: [{
        properties: {
          scale: '40000',
          title: 'Map A',
          attribution: 'ETH',
          source: 'e-maps',
          url: 'example.com',
          description: 'Desc'
        }
      }]
    } as any));

    (component as any).getLocationData(`${gnd},${qid}`).pipe(take(1)).subscribe((vm: PlacePageViewModel) => {
      expect(locationService.getTopicsFromGeoGraph).toHaveBeenCalledWith(gnd, qid);
      expect(locationService.getPoiFromGeoGraph).toHaveBeenCalledWith(gnd, qid);
      expect(vm.ethorama?.links?.length).toBe(1);
      expect(vm.maps?.[0].title).toContain('e-maps');
      done();
    });
  });


  it('handles gnd identifiers and service errors gracefully', (done) => {
    createComponent();
    component.lang = 'de';
    component.vid = 'VID';
    spyOn<any>(component, 'initMap');

    locationService.getTopicsFromGeoGraph.and.returnValue(throwError(() => new Error('topics')));
    locationService.getPoiFromGeoGraph.and.returnValue(throwError(() => new Error('poi')));
    locationService.getPlaceFromETHorama.and.returnValue(of({ items: [] } as any));
    locationService.getPlaceFromWikidata.and.returnValue(of({ results: { bindings: [] } } as any));
    locationService.getMapsFromGeoGraph.and.returnValue(of(null as any));
    locationService.getPlaceFromETHorama.calls.reset();

    (component as any).getLocationData('GND1234').pipe(take(1)).subscribe((vm: PlacePageViewModel) => {
      expect(locationService.getPlaceFromETHorama).not.toHaveBeenCalled();
      expect(vm.topics).toBeNull();
      expect(vm.poi).toBeNull();
      expect(vm.maps).toEqual([]);
      done();
    });
  });


  it('prevents default navigation and delegates to shell router', () => {
    createComponent();
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as Partial<Event>;

    component.navigate('/foo', event as Event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/foo');
  });


  it('opens, toggles and closes the license popover', fakeAsync(() => {
    createComponent();
    component.licensePopover = { nativeElement: { focus: jasmine.createSpy('focus') } } as any;
    component.licensePopoverTrigger = { nativeElement: { focus: jasmine.createSpy('triggerFocus') } } as any;

    component.open('details');
    tick();
    expect(component.isOpen('details')).toBeTrue();
    expect(component.licensePopover?.nativeElement.focus).toHaveBeenCalled();

    component.toggle('details');
    tick();
    expect(component.isOpen('details')).toBeFalse();
    expect(component.licensePopoverTrigger?.nativeElement.focus).toHaveBeenCalled();
  }));


  it('closes the popover when focus leaves the element', () => {
    createComponent();
    component.licensePopover = { nativeElement: { contains: () => false } } as any;
    spyOn(component as any, 'close');
    spyOn(console, 'error');

    component.onFocusOut({ relatedTarget: null } as FocusEvent);

    expect((component as any).close).toHaveBeenCalled();
  });


  it('removes previous map and aborts when map container is missing', () => {
    createComponent();
    const removeSpy = jasmine.createSpy('remove');
    (component as any).map = { remove: removeSpy };
    spyOn(document, 'getElementById').and.returnValue(null);

    (component as any).initMap([], '47.3', '8.5');

    expect(removeSpy).toHaveBeenCalled();
  });
});
