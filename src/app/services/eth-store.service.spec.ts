import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, map, of } from 'rxjs';
import { EthStoreService } from './eth-store.service';
import { Store } from '@ngrx/store';
import { HostComponent, PnxDoc, StoreDeliveryEntity } from '../models/eth.model';
import { BehaviorSubject } from 'rxjs';


class MockStore {
  private state$: BehaviorSubject<any>;

  constructor(initialState: any) {
    this.state$ = new BehaviorSubject(initialState);
  }

  setState(nextState: any) {
    this.state$.next(nextState);
  }

  getState() {
    return this.state$.getValue();
  }

  pipe(...ops: any[]): Observable<any> {
    return ops.reduce((obs, op) => op(obs), this.state$.asObservable());
  }

  select(selector: any): Observable<any> {
    return this.state$.asObservable().pipe(map(selector));
  }

  selectSignal(selector: any): () => any {
    return () => selector(this.state$.getValue());
  }
}

const makeState = (overrides: any = {}) => ({
  user: { isLoggedIn: false, decodedJwt: { onCampus: 'true', userName: 'u', userGroup: 'g', authenticationProfile: 'a', language: 'de' } },
  account: { personalDetails: { email: [{ value: 'test@example.com' }], patronstatus: [{ registration: [{ institution: [{ patronstatuscode: 'X', patronstatusname: 'Y' }] }] }] } },
  Search: { searchParams: { q: '', tab: '', scope: '' }, ids: [], entities: {} },
  viewConfig: { config: { vid: 'VID', 'primo-view': { scopes: [{ 'scope-id': 'SCOPE', tab: 'TAB' }] } } },
  router: { state: { url: '/search', root: { queryParams: {}, params: {}, url: [], fragment: null, data: {}, outlet: '', children: [] } }, navigationId: 0 },
  Delivery: { entities: {} },
  'full-display': { selectedRecordId: 'full1', linkedDataRecommendations: [] },
  'linked-data-entity': { entityId: 'E1', entityStatus: 'success' },
  ...overrides
});

describe('EthStoreService', () => {
  let service: EthStoreService;
  let mockStore: MockStore;

  beforeEach(() => {
    mockStore = new MockStore(makeState());

    TestBed.configureTestingModule({
      providers: [
        EthStoreService,
        { provide: Store, useValue: mockStore }
      ]
    });

    service = TestBed.inject(EthStoreService);
  });


  it('isOnCampus$ returns true when onCampus is "true"', async () => {
    mockStore.setState(makeState({
      user: {
        isLoggedIn: false,
        decodedJwt: {
          onCampus: 'true',
          userName: 'u',
          userGroup: 'g',
          authenticationProfile: 'a',
          language: 'de'
        }
      }
    }));
    const value = await firstValueFrom(service.isOnCampus$);
    expect(value).toBeTrue();
  });

  it('isOnCampus$ returns false when onCampus is not "true"', async () => {
    mockStore.setState(makeState({
      user: {
        isLoggedIn: false,
        decodedJwt: {
          onCampus: 'false',
          userName: 'u',
          userGroup: 'g',
          authenticationProfile: 'a',
          language: 'de'
        }
      }
    }));
    const value = await firstValueFrom(service.isOnCampus$);
    expect(value).toBeFalse();
  });

  it('isLoggedIn$ returns true when isLoggedIn is true', async () => {
    mockStore.setState(makeState({
      user: {
        isLoggedIn: true,
        decodedJwt: {
          onCampus: 'true',
          userName: 'u',
          userGroup: 'g',
          authenticationProfile: 'a',
          language: 'de'
        }
      }
    }));
    const value = await firstValueFrom(service.isLoggedIn$);
    expect(value).toBeTrue();
  });

  it('isLoggedIn$ returns false when isLoggedIn is false', async () => {
    mockStore.setState(makeState({
      user: {
        isLoggedIn: false,
        decodedJwt: {
          onCampus: 'true',
          userName: 'u',
          userGroup: 'g',
          authenticationProfile: 'a',
          language: 'de'
        }
      }
    }));
    const value = await firstValueFrom(service.isLoggedIn$);
    expect(value).toBeFalse();
  });


  it('returns vid from view config', () => {
    expect(service.getVid()).toBe('VID');
  });


  it('returns scope from url when present', () => {
    mockStore.setState(makeState({
      router: { state: { url: '/search', root: { queryParams: { search_scope: 'URL_SCOPE' }, params: {}, url: [], fragment: null, data: {}, outlet: '', children: [] } }, navigationId: 0 }
    }));
    expect(service.getScope()).toBe('URL_SCOPE');
  });


  it('returns scope from view config when url missing', () => {
    expect(service.getScope()).toBe('SCOPE');
  });


  it('returns tab from url when present', () => {
    mockStore.setState(makeState({
      router: { state: { url: '/search', root: { queryParams: { tab: 'URL_TAB' }, params: {}, url: [], fragment: null, data: {}, outlet: '', children: [] } }, navigationId: 0 }
    }));
    expect(service.getTab()).toBe('URL_TAB');
  });


  it('returns tab from view config when url missing', () => {
    expect(service.getTab()).toBe('TAB');
  });


  it('returns pnx record based on selectedRecordId from store (fullview)', async () => {
    const fullRecord = { pnx: { } } as PnxDoc;

    mockStore.setState(makeState({
      Search: { searchParams: { q: '', tab: '', scope: '' }, ids: [], entities: { full1: fullRecord } },
      'full-display': { selectedRecordId: 'full1', linkedDataRecommendations: [] }
    }));

    const hostComponent = { searchResult: { pnx: { control: { recordid: ['list1'] } } } } as HostComponent;
    const record = await firstValueFrom(service.getRecord$(hostComponent));
    expect(record).toBe(fullRecord);
  });


  it('returns pnx record based on recordid from hostComponent (listview)', async () => {
    const listRecord = { pnx: { } } as PnxDoc;

    mockStore.setState(makeState({
      Search: { searchParams: { q: '', tab: '', scope: '' }, ids: [], entities: { list1: listRecord } },
      'full-display': { linkedDataRecommendations: [] } as any
    }));

    const hostComponent = { searchResult: { pnx: { control: { recordid: ['list1'] } } } } as HostComponent;
    const record = await firstValueFrom(service.getRecord$(hostComponent));
    expect(record).toBe(listRecord);
  });


  it('returns delivery entity based on selectedRecordId from store (fullview)', async () => {
    const fullEntity = { delivery: { electronicServices: [] } } as StoreDeliveryEntity;

    mockStore.setState(makeState({
      Delivery: { entities: { full1: fullEntity } },
      'full-display': { selectedRecordId: 'full1', linkedDataRecommendations: [] }
    }));

    const entity = await firstValueFrom(service.getFullDisplayDeliveryEntity$());
    expect(entity).toBe(fullEntity);
  });


  it('returns delivery entity based on recordid from hostComponent (listview)', async () => {
    const listEntity = { delivery: { electronicServices: [] } } as StoreDeliveryEntity;

    mockStore.setState(makeState({
      Delivery: { entities: { list1: listEntity } },
      'full-display': { linkedDataRecommendations: [] }
    }));

    const hostComponent = { searchResult: { pnx: { control: { recordid: ['list1'] } } } } as HostComponent;
    const entity = await firstValueFrom(service.getDeliveryEntity$(hostComponent));
    expect(entity).toBe(listEntity);
  });


  it('is Fullview? yes', async () => {
    mockStore.setState(makeState({
      router: { state: { url: '/fulldisplay', root: { queryParams: {}, params: {}, url: [], fragment: null, data: {}, outlet: '', children: [] } }, navigationId: 0 }
    }));

    const value = await firstValueFrom(service.isFullview$());
    expect(value).toBeTrue();
  });
  
  
  it('is Fullview? no', async () => {
    mockStore.setState(makeState({
      router: { state: { url: '/search', root: { queryParams: {}, params: {}, url: [], fragment: null, data: {}, outlet: '', children: [] } }, navigationId: 0 }
    }));

    const value = await firstValueFrom(service.isFullview$());
    expect(value).toBeFalse();
  });

});
