import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
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

  const storeServiceMock = {
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


  it('renders text instead of link when url is missing', async () => {
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
});
