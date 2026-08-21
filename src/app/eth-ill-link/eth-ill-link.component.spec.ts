import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, firstValueFrom, Observable, of, throwError } from 'rxjs';
import { EthIllLinkComponent } from './eth-ill-link.component';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { PnxDoc, StoreDeliveryEntity } from '../models/eth.model';

interface StoreOverrides {
  isLoggedIn$?: Observable<boolean>;
  getFullDisplayRecord$?: () => Observable<PnxDoc | null>;
  getFullDisplayDeliveryEntity$?: () => Observable<StoreDeliveryEntity | null>;
}

interface SetupOptions {
  store?: StoreOverrides;
  translate?: { stream: (key: string) => Observable<string> };
  ngrxState?: any;
}

class MockNgrxStore {
  private state$: BehaviorSubject<any>;

  constructor(initialState: any) {
    this.state$ = new BehaviorSubject(initialState);
  }

  setState(nextState: any) {
    this.state$.next(nextState);
  }

  pipe(...ops: any[]): Observable<any> {
    return ops.reduce((obs, op) => op(obs), this.state$.asObservable());
  }
}

const makeNgrxState = (entity: any = null) => ({
  'full-display': { selectedRecordId: 'alma123' },
  user: { decodedJwt: { userGroup: 'GRP' } },
  'ngrs-record-data': { entities: entity ? { GRP_123: entity } : {} }
});

const rapidoEntity = (rapidoOfferWrapper: any = {}, status: string = 'success') => ({
  rapidoOffersStatus: status,
  rapidoDigitalOffersStatus: status,
  rapidoOfferWrapper
});

describe('EthIllLinkComponent', () => {
  let component: EthIllLinkComponent;
  let fixture: ComponentFixture<EthIllLinkComponent>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let mockNgrxStore: MockNgrxStore;

  const defaultDisplay = {
    title: ['Some Title'],
    creator: ['Author'],
    creationdate: ['2020'],
    publisher: ['Publisher'],
    identifier: ['ISSN: 5678-0000'],
    type: [] as string[],
    ispartof: [] as string[]
  };

  const defaultAddata: Record<string, any> = {};

  const createRecord = (
    displayOverrides: Partial<typeof defaultDisplay> = {},
    addataOverrides: Record<string, any> = {}
  ): PnxDoc => ({
    pnx: {
      display: { ...defaultDisplay, ...displayOverrides },
      addata: { ...defaultAddata, ...addataOverrides }
    }
  }) as PnxDoc;

  const baseStore = () => ({
    isLoggedIn$: of(true),
    getFullDisplayRecord$: () => of(null),
    getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['available'] } })
  });


  const defaultTranslate = {
    stream: (key: string) => of(key)
  };


  async function setupTest(options: SetupOptions = {}) {
    await TestBed.resetTestingModule();

    const storeDefaults = baseStore();
    const storeServiceMock = {
      isLoggedIn$: options.store?.isLoggedIn$ ?? storeDefaults.isLoggedIn$,
      getFullDisplayRecord$: options.store?.getFullDisplayRecord$ ?? storeDefaults.getFullDisplayRecord$,
      getFullDisplayDeliveryEntity$: options.store?.getFullDisplayDeliveryEntity$ ?? storeDefaults.getFullDisplayDeliveryEntity$
    };

    const translateServiceMock = options.translate ?? defaultTranslate;

    mockNgrxStore = new MockNgrxStore(options.ngrxState ?? makeNgrxState());

    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError', 'logError']);

    await TestBed.configureTestingModule({
      imports: [EthIllLinkComponent],
      providers: [
        { provide: EthStoreService, useValue: storeServiceMock },
        { provide: TranslateService, useValue: translateServiceMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: Store, useValue: mockNgrxStore }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthIllLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });


  it('no ill link when availability is not "no_inventory"', async () => {
    await setupTest();
    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeNull();
  });


  /*it('no ill link when nde-get-it-from-other element exists', async () => {
    const blocker = document.createElement('nde-get-it-from-other');
    document.body.appendChild(blocker);

    try {
      await setupTest({
        store: {
          getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
        }
      });

      const qs = await firstValueFrom(component.qs$);
      expect(qs).toBeNull();
    } finally {
      blocker.remove();
    }
  });*/


  it('ill link when availability=no_inventory and rapido store reports no offer', async () => {
    const record = createRecord();

    await setupTest({
      store: {
        getFullDisplayRecord$: () => of(record),
        getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
      },
      ngrxState: makeNgrxState(rapidoEntity({}))
    });

    const qs = await firstValueFrom(component.qs$);
    expect(qs).toContain('jtitle=Some%20Title');
    expect(qs).toContain('au=Author');
  });


  it('no ill link when availability=no_inventory and rapido store reports an offer', async () => {
    const record = createRecord();

    await setupTest({
      store: {
        getFullDisplayRecord$: () => of(record),
        getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
      },
      ngrxState: makeNgrxState(rapidoEntity({ bestPhysicalPolicy: 'SOME_POLICY' }))
    });

    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeNull();
  });


  it('url$ builds full url from translation when qs is present', async () => {
    const record = createRecord();

    const translateMock = {
      stream: (key: string) => of(key === 'eth.illLink.url' ? 'https://ill.example/ill' : key)
    };

    await setupTest({
      store: {
        getFullDisplayRecord$: () => of(record),
        getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
      },
      translate: translateMock,
      ngrxState: makeNgrxState(rapidoEntity({}))
    });

    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeTruthy();

    const url = await firstValueFrom(component.url$);
    expect(url).toBe(`https://ill.example/ill?${qs}`);
  });


  it('qs$ logs errors when store observable fails', async () => {
    await setupTest({
      store: {
        getFullDisplayRecord$: () => throwError(() => new Error('record fail'))
      }
    });

    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeNull();
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthIllLinkComponent.qs$');
  });


  it('translations$ returns null when translation stream errors', async () => {
    const record = createRecord();

    const translateMock = {
      stream: () => throwError(() => new Error('translate fail'))
    };

    await setupTest({
      store: {
        getFullDisplayRecord$: () => of(record),
        getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
      },
      translate: translateMock,
      ngrxState: makeNgrxState(rapidoEntity({}))
    });

    const bundle = await firstValueFrom(component.translations$);
    expect(bundle).toBeNull();
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthIllLinkComponent.translations$');
  });


  it('url$ returns null when base url translation fails', async () => {
    const record = createRecord();

    const translateMock = {
      stream: (key: string) =>
        key === 'eth.illLink.url' ? throwError(() => new Error('url fail')) : of(key)
    };

    await setupTest({
      store: {
        getFullDisplayRecord$: () => of(record),
        getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
      },
      translate: translateMock,
      ngrxState: makeNgrxState(rapidoEntity({}))
    });

    const url = await firstValueFrom(component.url$);
    expect(url).toBeNull();
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthIllLinkComponent.url$');
  });


  it('emits querystring once rapido store data resolves later', async () => {
    const record = createRecord();

    await setupTest({
      store: {
        getFullDisplayRecord$: () => of(record),
        getFullDisplayDeliveryEntity$: () => of({ delivery: { availability: ['no_inventory'] } })
      },
      ngrxState: makeNgrxState(rapidoEntity({}, 'pending'))
    });

    const qsPromise = firstValueFrom(component.qs$);

    setTimeout(() => {
      mockNgrxStore.setState(makeNgrxState(rapidoEntity({})));
    }, 0);

    const qs = await qsPromise;
    expect(qs).toContain('jtitle=Some%20Title');
  });


  it('logs sync errors when getIllQsOrNull throws', async () => {
    await setupTest();

    const originalGetRapidoOfferState = (component as any).getRapidoOfferState$;
    (component as any).getRapidoOfferState$ = () => {
      throw new Error('store boom');
    };

    const result = await firstValueFrom(
      (component as any).getIllQsOrNull(createRecord(), { delivery: { availability: ['no_inventory'] } } as StoreDeliveryEntity)
    );

    expect(result).toBeNull();
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthIllLinkComponent.getIllQsOrNull()');

    (component as any).getRapidoOfferState$ = originalGetRapidoOfferState;
  });


  it('buildQs returns empty string when record missing', async () => {
    await setupTest();
    expect((component as any).buildQs(null)).toBe('');
  });


  it('buildQs builds article query string', async () => {
    await setupTest();
    const record = createRecord(
      { type: ['article'], ispartof: ['Journal$$QVolume 1'] },
      {
        atitle: ['Article Title'],
        jtitle: ['Journal Name'],
        au: ['Author One'],
        volume: ['42'],
        pages: ['1-5'],
        issn: ['1234-5678'],
        date: ['2024']
      }
    );

    const qs = (component as any).buildQs(record);
    expect(qs).toContain('atitle=Article%20Title');
    expect(qs).toContain('jtitle=Journal%20Name');
    expect(qs).toContain('au=Author%20One');
    expect(qs).toContain('volume=42');
    expect(qs).toContain('pages=1-5');
    expect(qs).toContain('issn=1234-5678');
    expect(qs).toContain('date=2024');
  });


  it('buildQs builds book chapter query string', async () => {
    await setupTest();
    const record = createRecord(
      { type: ['book_chapter'] },
      {
        atitle: ['Chapter Title'],
        btitle: ['Book Title'],
        au: ['Author A', 'Author B'],
        volume: ['7'],
        pages: ['10-20'],
        isbn: ['1111'],
        date: ['1999']
      }
    );

    const qs = (component as any).buildQs(record);
    expect(qs).toContain('atitle=Chapter%20Title');
    expect(qs).toContain('jtitle=Book%20Title');
    expect(qs).toContain('au=Author%20A%2C%20Author%20B');
    expect(qs).toContain('volume=7');
    expect(qs).toContain('pages=10-20');
    expect(qs).toContain('issn=1111');
    expect(qs).toContain('date=1999');
  });


  it('buildQs uses display fallback and skips empty publisher', async () => {
    await setupTest();
    const record = createRecord(
      {
        publisher: undefined,
        identifier: ['ISSN: 9999-0000']
      },
      {}
    );

    const qs = (component as any).buildQs(record);
    expect(qs).toContain('jtitle=Some%20Title');
    expect(qs).toContain('au=Author');
    expect(qs).toContain('date=2020');
    expect(qs).toContain('issn=9999-0000');
    expect(qs).not.toContain('publisher=');
  });
  

  it('buildQs logs sync errors when error is thrown', async () => {
    await setupTest();
    const record = new Proxy({}, {
      get: () => {
        throw new Error('proxy boom');
      }
    }) as PnxDoc;

    const qs = (component as any).buildQs(record);
    expect(qs).toBe('');
    expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthIllLinkComponent.buildQs()');
  });
});
