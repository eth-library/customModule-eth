import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of } from 'rxjs';
import { EthStoreService } from './eth-store.service';
import { Store } from '@ngrx/store';
import { HostComponent, PnxDoc, StoreDeliveryEntity } from '../models/eth.model';

class MockStore {
  private state: any;

  constructor(initialState: any) {
    this.state = initialState;
  }

  setState(nextState: any) {
    this.state = nextState;
  }

  pipe(...ops: any[]): Observable<any> {
    return ops.reduce((obs, op) => op(obs), of(this.state));
  }

  select(selector: any): Observable<any> {
    return of(selector(this.state));
  }

  selectSignal(selector: any): () => any {
    return () => selector(this.state);
  }
}

const makeState = (overrides: any = {}) => ({
  user: { isLoggedIn: false, decodedJwt: { onCampus: 'false', userName: 'u', userGroup: 'g', authenticationProfile: 'a', language: 'de' } },
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


  it('returns full display record when available', async () => {
    const fullRecord = { pnx: { } } as PnxDoc;
    const listRecord = { pnx: { } } as PnxDoc;

    mockStore.setState(makeState({
      Search: { searchParams: { q: '', tab: '', scope: '' }, ids: [], entities: { full1: fullRecord, list1: listRecord } },
      'full-display': { selectedRecordId: 'full1', linkedDataRecommendations: [] }
    }));

    const hostComponent = { searchResult: { pnx: { control: { recordid: ['list1'] } } } } as HostComponent;
    const record = await firstValueFrom(service.getRecord$(hostComponent));
    expect(record).toBe(fullRecord);
  });


  it('falls back to listview record when full display record missing', async () => {
    const listRecord = { pnx: { display: { } } } as PnxDoc;

    mockStore.setState(makeState({
      Search: { searchParams: { q: '', tab: '', scope: '' }, ids: [], entities: { list1: listRecord } },
      'full-display': { linkedDataRecommendations: [] } as any
    }));

    const hostComponent = { searchResult: { pnx: { control: { recordid: ['list1'] } } } } as HostComponent;
    const record = await firstValueFrom(service.getRecord$(hostComponent));
    expect(record).toBe(listRecord);
  });


  it('returns full display delivery entity when available', async () => {
    const fullEntity = { delivery: { electronicServices: [] } } as StoreDeliveryEntity;

    mockStore.setState(makeState({
      Delivery: { entities: { full1: fullEntity } },
      'full-display': { selectedRecordId: 'full1', linkedDataRecommendations: [] }
    }));

    const entity = await firstValueFrom(service.getFullDisplayDeliveryEntity$());
    expect(entity).toBe(fullEntity);
  });


  it('falls back to listview delivery entity when full display missing', async () => {
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
