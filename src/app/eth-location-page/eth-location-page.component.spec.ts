import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BehaviorSubject, Observable, Subject, of, take } from 'rxjs';
import { EthLocationPageComponent } from './eth-location-page.component';
import { EthLocationPageService } from './eth-location-page.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from '../injection-tokens';

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
  let linkedDataEntityStatus$: BehaviorSubject<string>;

  let locationService: jasmine.SpyObj<EthLocationPageService>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let translateService: { currentLang: string; onLangChange: Subject<{ lang: string }>; stream: (key: string) => Observable<string> };
  let router: { url: string; navigateByUrl: jasmine.Spy };

  beforeEach(async () => {
    linkedDataEntityId$ = new BehaviorSubject<string>('Q72');
    linkedDataEntityStatus$ = new BehaviorSubject<string>('error');

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
});
