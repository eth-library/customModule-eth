import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { EthGeoRefComponent } from './eth-geo-ref.component';
import { EthGeoRefService } from './eth-geo-ref.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from '../../injection-tokens';
import { PnxDoc, PlaceGeoRefVM, PlacesGeoRefVM } from '../../models/eth.model';

describe('EthGeoRefComponent', () => {
  let component: EthGeoRefComponent;
  let fixture: ComponentFixture<EthGeoRefComponent>;
  let geoRefServiceSpy: jasmine.SpyObj<EthGeoRefService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let linkedDataRecommendations$: BehaviorSubject<any[]>;

  const storeServiceMock: any = {
    getRecord$: jasmine.createSpy().and.returnValue(of({
      pnx: {
        display: { lds03: [] },
        control: { sourcerecordid: [] }
      }
    } as unknown as PnxDoc)),
    getVid: () => 'vid',
    getTab: () => 'tab',
    getScope: () => 'scope',
    linkedDataRecommendations$: of([])
  };

  const translateServiceMock = {
    currentLang: 'de',
    stream: (key: string) => of(key)
  };

  const routerMock = {
    navigateByUrl: jasmine.createSpy('navigateByUrl')
  };

  beforeEach(async () => {
    linkedDataRecommendations$ = new BehaviorSubject<any[]>([]);
    storeServiceMock.linkedDataRecommendations$ = linkedDataRecommendations$.asObservable();

    geoRefServiceSpy = jasmine.createSpyObj<EthGeoRefService>('EthGeoRefService', [
      'getPlacesFromLobid',
      'getGndPlacesFromGraph',
      'getPlacesFromETHorama',
      'enrichPOIs'
    ]);
    geoRefServiceSpy.getPlacesFromLobid.and.returnValue(of({ member: [] } as any));
    geoRefServiceSpy.getGndPlacesFromGraph.and.returnValue(of({ results: [] } as any));
    geoRefServiceSpy.getPlacesFromETHorama.and.returnValue(of({ items: [] } as any));
    geoRefServiceSpy.enrichPOIs.and.returnValue(of([]));

    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError', 'logSyncError']);

    await TestBed.configureTestingModule({
      imports: [EthGeoRefComponent],
      providers: [
        { provide: EthGeoRefService, useValue: geoRefServiceSpy },
        { provide: EthStoreService, useValue: storeServiceMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: SHELL_ROUTER, useValue: routerMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthGeoRefComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });


  it('renders a location card', async () => {
    const place: PlaceGeoRefVM = {
      id: 'p1',
      qid: 'Q1',
      label: 'Place One',
      url: '/entity/location?vid=vid&lang=de&entityId=Q1'
    };
    const places: PlacesGeoRefVM = {
      gndPlacesLobid: [],
      gndPlacesGraph: [],
      ethorama: [],
      allPlaces: [place]
    };
    spyOn(component, 'getPlaces').and.returnValue(of(places));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.nativeElement as HTMLElement;
    const link = container.querySelector('.eth-place-card__text a') as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('/nde' + place.url);
  });


  it('renders text instead of link when url of a location is missing', async () => {
    const place: PlaceGeoRefVM = {
      id: 'p2',
      qid: 'Q2',
      label: 'Place Two'
    };
    const places: PlacesGeoRefVM = {
      gndPlacesLobid: [],
      gndPlacesGraph: [],
      ethorama: [],
      allPlaces: [place]
    };
    spyOn(component, 'getPlaces').and.returnValue(of(places));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.nativeElement as HTMLElement;
    const link = container.querySelector('.eth-place-card__text a');
    const text = container.querySelector('.eth-place-card__text span');
    expect(link).toBeNull();
    expect(text?.textContent).toContain('Place Two');
    expect(text?.textContent).toContain(place.label);
  });

  
  it('navigates via router when link is clicked', async () => {
    const place: PlaceGeoRefVM = {
      id: 'p3',
      qid: 'Q3',
      label: 'Place Three',
      url: '/entity/location?vid=vid&lang=de&entityId=Q3'
    };
    const places: PlacesGeoRefVM = {
      gndPlacesLobid: [],
      gndPlacesGraph: [],
      ethorama: [],
      allPlaces: [place]
    };
    spyOn(component, 'getPlaces').and.returnValue(of(places));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.nativeElement as HTMLElement;
    const link = container.querySelector('.eth-place-card__text a') as HTMLAnchorElement;
    link.click();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(place.url + '#eth-top');
  });


  it('logs errors when getPlacesFromLobid fails', (done) => {
    geoRefServiceSpy.getPlacesFromLobid.and.returnValue(throwError(() => new Error('boom')));

    const record = {
      pnx: { display: { lds03: ['GND: Test: 123'] }, control: { sourcerecordid: [] } }
    } as unknown as PnxDoc;

    component.getPlaces(record).subscribe(result => {
      expect(result.gndPlacesLobid.length).toBe(0);
      expect(errorHandlingSpy.logError).toHaveBeenCalled();
      done();
    });
  });


  it('returns places from Geo Graph', (done) => {
    geoRefServiceSpy.getGndPlacesFromGraph.and.returnValue(of({
      results: [{ gnd: '123', qid: 'Q1', name: 'Place A', description: 'Desc' }]
    } as any));

    const record = {
      pnx: { display: { lds03: ['GND: Test: 123'] }, control: { sourcerecordid: [] } }
    } as unknown as PnxDoc;

    component.getPlaces(record).subscribe(result => {
      expect(result.gndPlacesGraph.length).toBe(1);
      expect(result.gndPlacesGraph[0].label).toBe('Place A');
      done();
    });
  });


  it('returns places from ETHorama', (done) => {
    geoRefServiceSpy.getPlacesFromETHorama.and.returnValue(of({ items: [{ id: 'p1' }] } as any));
    geoRefServiceSpy.enrichPOIs.and.returnValue(of([
      {
        id: 'p1',
        qid: 'Q1',
        lccn: 'L1',
        gnd: '123',
        name: 'ETHorama Place',
        descriptionWikidata: 'Desc',
        thumbnail: null
      }
    ] as any));

    const record = {
      pnx: { display: { lds03: [] }, control: { sourcerecordid: ['doc1'] } }
    } as unknown as PnxDoc;

    component.getPlaces(record).subscribe(result => {
      expect(result.ethorama.length).toBe(1);
      expect(result.ethorama[0].label).toBe('ETHorama Place');
      done();
    });
  });


  it('filters out location cards already rendered otb', (done) => {
    geoRefServiceSpy.getPlacesFromETHorama.and.returnValue(of({ items: [{ id: 'p1' }] } as any));
    geoRefServiceSpy.enrichPOIs.and.returnValue(of([
      { id: 'p1', lccn: 'L1', name: 'Place 1', descriptionWikidata: 'Desc' },
      { id: 'p2', lccn: 'L2', name: 'Place 2', descriptionWikidata: 'Desc' }
    ] as any));

    linkedDataRecommendations$.next([{ id: 'L1' }]);

    const record = {
      pnx: { display: { lds03: [] }, control: { sourcerecordid: ['doc1'] } }
    } as unknown as PnxDoc;

    component.getPlaces(record).subscribe(result => {
      expect(result.allPlaces.length).toBe(1);
      expect(result.allPlaces[0].lccn).toBe('L2');
      done();
    });
  });


  it('parses GND ids from lds03', () => {
    const record = {
      pnx: {
        display: {
          lds03: [
            'GND: Test: 119247496',
            'GND: <a href="https://explore.gnd.network/gnd/118527908">Name</a>',
            'No GND here'
          ]
        }
      }
    } as unknown as PnxDoc;

    const ids = (component as any).getGndIds(record) as string[];
    expect(ids).toContain('119247496');
    expect(ids).toContain('118527908');
    expect(ids.length).toBe(2);
  });


  it('merges places by shared ids', () => {
    const places = [
      { id: '1', qid: 'Q1', lccn: 'L1', label: 'Place 1', description: 'Desc 1' },
      { id: '2', qid: 'Q1', lccn: 'L2', label: 'Place 1b', thumbnail: 'thumb' },
      { id: '3', qid: 'Q2', label: 'Place 2' }
    ] as any;

    const merged = (component as any).mergePlacesById(places) as any[];
    expect(merged.length).toBe(2);
    const mergedQ1 = merged.find(p => p.qid === 'Q1');
    expect(mergedQ1.description).toBe('Desc 1');
    expect(mergedQ1.thumbnail).toBe('thumb');
  });
});
