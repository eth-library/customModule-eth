import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BehaviorSubject, Observable, of, skip, take, throwError } from 'rxjs';
import { EthProvenienzComponent } from './eth-provenienz.component';
import { EthProvenienzService } from './eth-provenienz.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
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
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('returns empty items when owner is not 41SLSP_ETH', (done) => {
    component.items$.pipe(take(1)).subscribe(items => {
      expect(items).toEqual([]);
      expect(provenienzService.getItems).not.toHaveBeenCalled();
      done();
    });

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_OTHER',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
  });


  it('get ETH e-rara items from delivery entities', (done) => {
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

    component.items$.subscribe(items => {
      if (items.length) {
        expect(items[0].url).toContain('vid=VID');
        expect(items[0].url).toContain('tab=TAB');
        expect(items[0].url).toContain('search_scope=SCOPE');
        done();
      }
    });

    deliveryEntity$.next({
      delivery: {
        recordOwner: '41SLSP_ETH',
        availabilityLinksUrl: ['https://doi.org/10.3931/e-rara-123']
      }
    });
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


  it('renders provenance cards in the template', (done) => {
    provenienzService.getItems.and.returnValue(of({
      items: [
        {
          id: '1',
          title: 'Title 1',
          description: 'Desc 1',
          eth_dating: '1900',
          eth_doi_link: 'https://doi.org/10.3931/e-rara-123'
        }
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

      const container = fixture.debugElement.query(By.css('.eth-provenance-cards'));
      const cardTitle = fixture.debugElement.query(By.css('.eth-provenance-card h5 a'));

      expect(container).toBeTruthy();
      expect(cardTitle).toBeTruthy();
      expect((cardTitle.nativeElement as HTMLElement).textContent).toContain('Desc 1');
      done();
    });
  });
});
