import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom, of, throwError } from 'rxjs';
import { EthGeoRefComponent } from './eth-geo-ref.component';
import { EthGeoRefService } from './eth-geo-ref.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthStoreService } from '../../services/eth-store.service';
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

  const createRecord = (lds03: string[] = [], sourcerecordid: string[] = []) => ({
    pnx: {
      display: { lds03 },
      control: { sourcerecordid }
    }
  } as unknown as PnxDoc);

  beforeEach(async () => {
    linkedDataRecommendations$ = new BehaviorSubject<any[]>([]);
    storeServiceMock.linkedDataRecommendations$ = linkedDataRecommendations$.asObservable();
    storeServiceMock.getRecord$.calls.reset();
    storeServiceMock.getRecord$.and.returnValue(of(createRecord()));

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

    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError', 'logError']);

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


  it('emits null via places$ when getRecord$ fails', async () => {
    storeServiceMock.getRecord$.and.returnValue(throwError(() => new Error('record fail')));

    const result = await firstValueFrom(component.places$);

    expect(result).toBeNull();
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthGeoRefComponent.places$');
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

    const record = createRecord(['GND: Test: 123']);

    component.getPlaces(record).subscribe(result => {
      expect(result.gndPlacesLobid.length).toBe(0);
      expect(errorHandlingSpy.logError).toHaveBeenCalled();
      done();
    });
  });


  it('filters lobid places without description or thumbnail', (done) => {
    geoRefServiceSpy.getPlacesFromLobid.and.returnValue(of({
      member: [
        {
          gndIdentifier: '123',
          preferredName: 'Empty',
          biographicalOrHistoricalInformation: [],
          depiction: []
        },
        {
          gndIdentifier: '456',
          preferredName: 'Rich',
          biographicalOrHistoricalInformation: ['Desc']
        }
      ]
    } as any));

    const record = createRecord(['GND: Test: 123', 'GND: Test: 456']);

    component.getPlaces(record).subscribe(result => {
      expect(result.gndPlacesLobid.length).toBe(1);
      expect(result.gndPlacesLobid[0].label).toBe('Rich');
      done();
    });
  });


  it('returns places from Geo Graph', (done) => {
    geoRefServiceSpy.getGndPlacesFromGraph.and.returnValue(of({
      results: [{ gnd: '123', qid: 'Q1', name: 'Place A', description: 'Desc' }]
    } as any));

    const record = createRecord(['GND: Test: 123']);

    component.getPlaces(record).subscribe(result => {
      expect(result.gndPlacesGraph.length).toBe(1);
      expect(result.gndPlacesGraph[0].label).toBe('Place A');
      done();
    });
  });


  it('logs errors when getGndPlacesFromGraph fails', (done) => {
    geoRefServiceSpy.getGndPlacesFromGraph.and.returnValue(throwError(() => new Error('graph')));

    const record = createRecord(['GND: Test: 123']);

    component.getPlaces(record).subscribe(result => {
      expect(result.gndPlacesGraph).toEqual([]);
      expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthGeoRefComponent.getGndPlacesFromGraph()');
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

    const record = createRecord([], ['doc1']);

    component.getPlaces(record).subscribe(result => {
      expect(result.ethorama.length).toBe(1);
      expect(result.ethorama[0].label).toBe('ETHorama Place');
      done();
    });
  });


  it('drops ethorama cards without identifiers', (done) => {
    geoRefServiceSpy.getPlacesFromETHorama.and.returnValue(of({ items: [{ id: 'p1' }, { id: 'p2' }] } as any));
    geoRefServiceSpy.enrichPOIs.and.returnValue(of([
      { id: 'p1', name: 'Missing ids' },
      { id: 'p2', qid: 'Q2', name: 'Valid' }
    ] as any));

    const record = createRecord([], ['doc1']);

    component.getPlaces(record).subscribe(result => {
      expect(result.ethorama.length).toBe(1);
      expect(result.ethorama[0].qid).toBe('Q2');
      done();
    });
  });


  it('deduplicates ethorama cards sharing keys', (done) => {
    geoRefServiceSpy.getPlacesFromETHorama.and.returnValue(of({ items: [{ id: 'p1' }, { id: 'p2' }] } as any));
    geoRefServiceSpy.enrichPOIs.and.returnValue(of([
      { id: 'p1', qid: 'Q2', name: 'First', thumbnail: 'thumb1' },
      { id: 'p2', qid: 'Q2', name: 'Second', thumbnail: 'thumb2' }
    ] as any));

    const record = createRecord([], ['doc1']);

    component.getPlaces(record).subscribe(result => {
      expect(result.ethorama.length).toBe(1);
      expect(result.ethorama[0].label).toBe('First');
      expect(result.ethorama[0].thumbnail).toBe('thumb1');
      done();
    });
  });


  it('returns empty ethorama list when upstream fails', (done) => {
    geoRefServiceSpy.getPlacesFromETHorama.and.returnValue(throwError(() => new Error('500')));

    const record = createRecord([], ['doc1']);

    component.getPlaces(record).subscribe(result => {
      expect(result.ethorama).toEqual([]);
      expect(geoRefServiceSpy.enrichPOIs).not.toHaveBeenCalled();
      expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
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

    const record = createRecord([], ['doc1']);

    component.getPlaces(record).subscribe(result => {
      expect(result.allPlaces.length).toBe(1);
      expect(result.allPlaces[0].lccn).toBe('L2');
      done();
    });
  });


  it('logs sync errors when getPlaces throws before creating streams', (done) => {
    const originalGetContext = (component as any).getContext;
    (component as any).getContext = () => {
      throw new Error('sync');
    };

    const record = createRecord();

    component.getPlaces(record).subscribe({
      next: result => {
        expect(result).toEqual({ gndPlacesLobid: [], gndPlacesGraph: [], ethorama: [], allPlaces: [] });
        expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthGeoRefComponent.getPlaces');
        (component as any).getContext = originalGetContext;
        done();
      },
      error: err => {
        (component as any).getContext = originalGetContext;
        fail(err);
      }
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

  it('parses a GND id from a plain URL', () => {
    const record = createRecord(['https://explore.gnd.network/gnd/118527908']);

    const ids = (component as any).getGndIds(record) as string[];

    expect(ids).toEqual(['118527908']);
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
  

  it('ignores places without identifiers when merging', () => {
    const places = [
      { id: '1', label: 'No ids' },
      { id: '2', qid: 'Q2', label: 'Has id' }
    ] as any;

    const merged = (component as any).mergePlacesById(places) as any[];

    expect(merged.length).toBe(1);
    expect(merged[0].qid).toBe('Q2');
  });


  describe('mapGndPlacesLobidToVm', () => {
    it('maps lobid responses into sorted place models', () => {
      const data = {
        member: [
          {
            gndIdentifier: '456',
            preferredName: 'B Place',
            sameAs: [
              { id: 'https://www.wikidata.org/entity/Q2' },
              { id: 'https://id.loc.gov/authorities/names/n456' }
            ],
            depiction: [{ thumbnail: 'thumb-b' }],
            biographicalOrHistoricalInformation: ['Bio B']
          },
          {
            gndIdentifier: '123',
            preferredName: 'A Place',
            sameAs: [
              { id: 'https://www.wikidata.org/entity/Q1' }
            ],
            depiction: [{ thumbnail: 'thumb-a' }],
            biographicalOrHistoricalInformation: ['Bio A']
          }
        ]
      } as any;

      const result = (component as any).mapGndPlacesLobidToVm(data, { vid: 'vid', lang: 'de' });

      expect(result[0].label).toBe('A Place');
      expect(result[0].url).toContain('entityId=123,Q1');
      expect(result[1].lccn).toBe('n456');
    });
  });


  describe('mapGndPlacesGraphToVm', () => {
    it('maps graph responses into sorted place models', () => {
      const data = {
        results: [
          { gnd: '123', qid: 'Q1', name: 'Alpha', description: 'Desc A', image: 'img-a' },
          { gnd: '456', lccn: 'n456', name: 'Beta', description: 'Desc B' }
        ]
      } as any;

      const result = (component as any).mapGndPlacesGraphToVm(data, { vid: 'vid', lang: 'de' });

      expect(result.length).toBe(2);
      expect(result[0].label).toBe('Alpha');
      expect(result[1].url).toContain('entityId=n456');
    });
  });
  

  describe('buildLocationEntityUrl', () => {
    it('returns undefined when vid is missing', () => {
      const url = (component as any).buildLocationEntityUrl({ gnd: '123' }, { vid: '', lang: 'de' });
      expect(url).toBeUndefined();
    });

    it('prefers lccn when present', () => {
      const url = (component as any).buildLocationEntityUrl({ lccn: 'n123' }, { vid: 'vid', lang: 'de' });
      expect(url).toContain('entityId=n123');
    });

    it('combines gnd and qid when both available', () => {
      const url = (component as any).buildLocationEntityUrl({ gnd: '123', qid: 'Q1' }, { vid: 'vid', lang: 'de' });
      expect(url).toContain('entityId=123,Q1');
    });

    it('falls back to qid only', () => {
      const url = (component as any).buildLocationEntityUrl({ qid: 'Q1' }, { vid: 'vid', lang: 'de' });
      expect(url).toContain('entityId=Q1');
    });

    it('builds from gnd when qid is missing', () => {
      const url = (component as any).buildLocationEntityUrl({ gnd: '123' }, { vid: 'vid', lang: 'de' });
      expect(url).toContain('entityId=GND123');
    });

    it('encodes entity URL parameters', () => {
      const url = (component as any).buildLocationEntityUrl(
        { qid: 'Q 1' },
        { vid: 'vid&test', lang: 'de-CH' }
      );

      expect(url).toContain('vid=vid%26test');
      expect(url).toContain('entityId=Q%201');
    });

    it('returns undefined when no identifiers exist', () => {
      const url = (component as any).buildLocationEntityUrl({}, { vid: 'vid', lang: 'de' });
      expect(url).toBeUndefined();
    });
  });
});
