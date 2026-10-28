import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Observable, of, skip, take, throwError } from 'rxjs';
import { EthProvenienzComponent } from './eth-provenienz.component';
import { EthProvenienzService } from './eth-provenienz.service';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { SHELL_ROUTER } from '../../injection-tokens';

describe('EthProvenienzComponent', () => {
  let component: EthProvenienzComponent;
  let fixture: ComponentFixture<EthProvenienzComponent>;
  let deliveryEntity$: BehaviorSubject<any>;

  let provenienzService: jasmine.SpyObj<EthProvenienzService>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let translateService: { stream: (key: string) => Observable<string> };

  beforeEach(async () => {
    deliveryEntity$ = new BehaviorSubject<any>(null);

    provenienzService = jasmine.createSpyObj<EthProvenienzService>('EthProvenienzService', [
      'getItems'
    ]);
    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getFullDisplayDeliveryEntity$',
      'getVid',
      'getTab',
      'getScope'
    ]);
    errorHandlingService = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError'
    ]);
    translateService = {
      stream: (key: string) => of(key)
    };

    storeService.getFullDisplayDeliveryEntity$.and.returnValue(deliveryEntity$.asObservable());
    storeService.getVid.and.returnValue('VID');
    storeService.getTab.and.returnValue('TAB');
    storeService.getScope.and.returnValue('SCOPE');

    await TestBed.configureTestingModule({
      imports: [EthProvenienzComponent],
      providers: [
        { provide: EthProvenienzService, useValue: provenienzService },
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingService },
        { provide: TranslateService, useValue: translateService },
        { provide: SHELL_ROUTER, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthProvenienzComponent);
    component = fixture.componentInstance;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  // BehaviorSubject and of() emit synchronously, so emissions can be collected and asserted directly
  function collectEmissions(entity: any): any[][] {
    const emissions: any[][] = [];
    const subscription = component.items$.subscribe(items => emissions.push(items));
    deliveryEntity$.next(entity);
    subscription.unsubscribe();
    return emissions;
  }


  it('returns nothing when owner is not 41SLSP_ETH', () => {
    const emissions = collectEmissions({
      delivery: {
        recordOwner: '41SLSP_OTHER',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });

    expect(emissions).toEqual([[]]);
    expect(provenienzService.getItems).not.toHaveBeenCalled();
  });


  it('returns nothing when url does not include "doi.org/10.3931/e-rara-"', () => {
    const emissions = collectEmissions({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://bla.org/10.1234/e-rara-123']
      }
    });

    expect(emissions).toEqual([[]]);
    expect(provenienzService.getItems).not.toHaveBeenCalled();
  });


  it('returns nothing when the delivery entity is null', () => {
    const emissions = collectEmissions(null);

    expect(emissions).toEqual([[]]);
    expect(provenienzService.getItems).not.toHaveBeenCalled();
  });


  it('returns nothing when delivery or availabilityLinksUrl is missing', () => {
    expect(collectEmissions({})).toEqual([[]]);
    expect(collectEmissions({ delivery: { recordOwner: '41SLSP_ETH' } })).toEqual([[]]);
    expect(provenienzService.getItems).not.toHaveBeenCalled();
  });


  it('get ETH e-rara items from delivery entities', () => {
    provenienzService.getItems.and.returnValue(of({
      items: [
        {
          id: '1',
          title: 'Title 1',
          description: 'Desc 1',
          eth_doi_link: 'https://doi.org/10.3931/e-rara-123'
        }
      ]
    } as any));

    const emissions = collectEmissions({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });

    expect(provenienzService.getItems).toHaveBeenCalledOnceWith('10.3931/e-rara-123');
    expect(emissions.length).toBe(2);
    expect(emissions[0]).toEqual([]);
    expect(emissions[1].length).toBe(1);
    expect(emissions[1][0].url).toBe(
      `/search?vid=VID&tab=TAB&search_scope=SCOPE&query=${encodeURIComponent('10.3931/e-rara-123')}`
    );
  });


  it('falls back to empty values and encodes special characters in the url', () => {
    storeService.getVid.and.returnValue(null as any);
    storeService.getTab.and.returnValue('a b&c');
    storeService.getScope.and.returnValue(undefined as any);
    provenienzService.getItems.and.returnValue(of({
      items: [{ id: '1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' }]
    } as any));

    const emissions = collectEmissions({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });

    expect(emissions[1][0].url).toBe(
      `/search?vid=&tab=${encodeURIComponent('a b&c')}&search_scope=&query=${encodeURIComponent('10.3931/e-rara-123')}`
    );
  });


  it('keeps working after a service error when the delivery entity changes', () => {
    provenienzService.getItems.and.returnValues(
      throwError(() => new Error('fail')),
      of({ items: [{ id: '1', description: 'Desc 1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' }] } as any)
    );
    const emissions: any[][] = [];
    const subscription = component.items$.subscribe(items => emissions.push(items));
    const entity = {
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    };

    deliveryEntity$.next(entity);
    deliveryEntity$.next({ ...entity });
    subscription.unsubscribe();

    expect(errorHandlingService.logError).toHaveBeenCalledTimes(1);
    expect(emissions[emissions.length - 1].length).toBe(1);
    expect(emissions[emissions.length - 1][0].id).toBe('1');
  });


  it('returns empty list when ethProvenienzService responds without items', (done) => {
    provenienzService.getItems.and.returnValue(of({} as any));

    component.items$.pipe(skip(1), take(1)).subscribe(items => {
      expect(items).toEqual([]);
      done();
    });

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
  });


  it('returns items from the ethProvenienzService response', (done) => {
    provenienzService.getItems.and.returnValue(of({
      items: [
        { id: '1', description: 'Desc 1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' }
      ]
    } as any));

    component.items$.pipe(skip(1), take(1)).subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('1');
      done();
    });

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
  });


  it('handles service errors with catchError', (done) => {
    provenienzService.getItems.and.returnValue(throwError(() => new Error('fail')));

    component.items$.pipe(skip(1), take(1)).subscribe(items => {
      expect(items).toEqual([]);
      expect(errorHandlingService.logError).toHaveBeenCalled();
      done();
    });

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
  });


  it('renders provenance links in the template', (done) => {
    provenienzService.getItems.and.returnValue(of({
      items: [
        { id: '1', description: 'Desc 1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' }
      ]
    } as any));

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });

    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.eth-provenance-links'));
      const link = fixture.debugElement.query(By.css('.eth-provenance-link a'));

      expect(container).toBeTruthy();
      expect(link).toBeTruthy();
      expect((link.nativeElement as HTMLElement).textContent?.trim()).toBe('Desc 1');
      expect((link.nativeElement as HTMLAnchorElement).getAttribute('href')).toContain('/nde/search?vid=VID');
      done();
    });
  });


  it('uses the translated fallback text when description is missing', (done) => {
    provenienzService.getItems.and.returnValue(of({
      items: [
        { id: '1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' },
        { id: '2', description: '   ', eth_doi_link: 'https://doi.org/10.3931/e-rara-456' }
      ]
    } as any));

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });

    fixture.detectChanges();

    fixture.whenStable().then(() => {
      fixture.detectChanges();

      const links = fixture.debugElement.queryAll(By.css('.eth-provenance-link a'));

      expect(links.length).toBe(2);
      links.forEach(link =>
        expect((link.nativeElement as HTMLElement).textContent?.trim()).toBe('eth.provenance.linkText')
      );
      done();
    });
  });


  it('maps items to id, description and a search url, removing duplicates', (done) => {
    provenienzService.getItems.and.returnValue(of({
      items: [
        { id: '1', description: 'Desc 1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' },
        { id: '1', description: 'Desc 1 duplicate', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' },
        { id: '2', description: 'Desc 2' }
      ]
    } as any));

    component.items$.pipe(skip(1), take(1)).subscribe(items => {
      expect(items.length).toBe(2);
      expect(items[0].id).toBe('1');
      expect(items[0].description).toBe('Desc 1');
      expect(items[0].url).toContain(`query=${encodeURIComponent('10.3931/e-rara-123')}`);
      expect(items[1].url).toMatch(/query=$/);
      done();
    });

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
  });


  it('navigate prevents the default action and navigates via the shell router', () => {
    const router = TestBed.inject(SHELL_ROUTER) as any;
    const event = jasmine.createSpyObj<Event>('Event', ['preventDefault']);

    component.navigate('/search?query=x', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith('/search?query=x');
  });


  it('navigates via the router when a rendered link is clicked', async () => {
    provenienzService.getItems.and.returnValue(of({
      items: [{ id: '1', description: 'Desc 1', eth_doi_link: 'https://doi.org/10.3931/e-rara-123' }]
    } as any));
    const router = TestBed.inject(SHELL_ROUTER) as any;

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('.eth-provenance-link a'));
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.nativeElement.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBeTrue();
    expect(router.navigateByUrl).toHaveBeenCalledOnceWith(
      `/search?vid=VID&tab=TAB&search_scope=SCOPE&query=${encodeURIComponent('10.3931/e-rara-123')}`
    );
  });
});
