import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthMetagridService } from './eth-metagrid.service';

const BASE_URL = 'https://api.metagrid.ch/search';

describe('EthMetagridService', () => {
  let service: EthMetagridService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        EthMetagridService
      ]
    });

    service = TestBed.inject(EthMetagridService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests resources for gnd ids and maps results', () => {
    const gndIds = ['G1', 'G2'];
    const whitelist = ['gnd', 'viaf'];

    service.getResourcesForGndIds(gndIds, whitelist).subscribe(result => {
      expect(result.length).toBe(2);

      expect(result[0].gnd).toBe('G1');
      expect(result[0].id).toBe('c1');
      expect(result[0].name).toBe('Ada Lovelace');
      expect(result[0].resources?.length).toBe(1);
      expect(result[0].resources?.[0].provider).toBe('gnd');
      expect(result[0].resources?.[0].uri).toBe('http://gnd/1');

      expect(result[1].gnd).toBe('G2');
      expect(result[1].id).toBe('c2');
      expect(result[1].name).toBe('Only Name');
      expect(result[1].resources?.length).toBe(0);
    });

    const req1 = httpMock.expectOne(
      `${BASE_URL}?group=1&skip=0&take=50&provider=gnd&query=${encodeURIComponent(gndIds[0])}`
    );
    expect(req1.request.method).toBe('GET');
    req1.flush({
      meta: { total: 1, start: 0, limit: 50, uri: '' },
      concordances: [
        {
          id: 'c1',
          name: 'Fallback',
          resources: [
            {
              _type: 'person',
              identifier: 'id1',
              provider: { slug: 'gnd', uri: 'http://gnd' },
              link: { rel: 'self', uri: 'http://gnd/1' },
              concordance: { id: 'x', uri: 'http://c' },
              metadata: { first_name: 'Ada', last_name: 'Lovelace' }
            },
            {
              _type: 'person',
              identifier: 'id2',
              provider: { slug: 'other', uri: 'http://other' },
              link: { rel: 'self', uri: 'http://other/1' },
              concordance: { id: 'y', uri: 'http://c2' },
              metadata: { first_name: 'Ignored', last_name: 'Provider' }
            }
          ]
        }
      ]
    });

    const req2 = httpMock.expectOne(
      `${BASE_URL}?group=1&skip=0&take=50&provider=gnd&query=${encodeURIComponent(gndIds[1])}`
    );
    expect(req2.request.method).toBe('GET');
    req2.flush({
      meta: { total: 1, start: 0, limit: 50, uri: '' },
      concordances: [
        {
          id: 'c2',
          name: 'Only Name',
          resources: []
        }
      ]
    });
  });


  it('requests resources for id refs using sudoc provider', () => {
    const idRefs = ['A1'];

    service.getResourcesForIdRefs(idRefs, ['gnd']).subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].idRef).toBe('A1');
      expect(result[0].id).toBe('c3');
      expect(result[0].name).toBe('Grace Hopper');
    });

    const req = httpMock.expectOne(
      `${BASE_URL}?group=1&skip=0&take=50&provider=sudoc&query=${encodeURIComponent(idRefs[0])}`
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      meta: { total: 1, start: 0, limit: 50, uri: '' },
      concordances: [
        {
          id: 'c3',
          resources: [
            {
              _type: 'person',
              identifier: 'id3',
              provider: { slug: 'gnd', uri: 'http://gnd' },
              link: { rel: 'self', uri: 'http://gnd/3' },
              concordance: { id: 'z', uri: 'http://c3' },
              metadata: { first_name: 'Grace', last_name: 'Hopper' }
            }
          ]
        }
      ]
    });
  });

  it('returns placeholder person when request fails', () => {
    spyOn(console, 'error');

    service.getResourcesForGndIds(['G3'], ['gnd']).subscribe(result => {
      expect(result.length).toBe(1);
      expect(result[0].gnd).toBe('G3');
      expect(result[0].id).toBeNull();
      expect(result[0].name).toBeNull();
      expect(result[0].resources?.length).toBe(0);
    });

    const req = httpMock.expectOne(
      `${BASE_URL}?group=1&skip=0&take=50&provider=gnd&query=${encodeURIComponent('G3')}`
    );
    req.flush('fail', { status: 500, statusText: 'Server Error' });

    expect(console.error).toHaveBeenCalled();
  });
});
