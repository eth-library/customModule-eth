import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { EthProvenienzEraraLinkComponent } from './eth-provenienz-erara-link.component';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { PnxDoc, Sourcesystem } from '../../models/eth.model';
import { SHELL_ROUTER } from '../../injection-tokens';

type PnxDocOverrides = {
  pnx?: {
    display?: NonNullable<PnxDoc['pnx']>['display'];
    control?: Partial<NonNullable<PnxDoc['pnx']>['control']>;
  };
};

const buildPnxDoc = (overrides: PnxDocOverrides): PnxDoc => {
  const baseControl = {
    sourcerecordid: ['dummy'],
    recordid: ['dummy'],
    sourceid: ['dummy'],
    originalsourceid: ['dummy'],
    sourcesystem: [Sourcesystem.Ils]
  };

  return {
    pnx: {
      ...overrides.pnx,
      control: {
        ...baseControl,
        ...(overrides.pnx?.control ?? {})
      }
    }
  };
};

describe('EthProvenienzEraraLinkComponent', () => {
  let component: EthProvenienzEraraLinkComponent;
  let fixture: ComponentFixture<EthProvenienzEraraLinkComponent>;
  let storeService: jasmine.SpyObj<EthStoreService>;

  beforeEach(async () => {
    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getFullDisplayRecord$',
      'getTab',
      'getScope',
      'getVid'
    ]);

    storeService.getTab.and.returnValue('default_tab');
    storeService.getScope.and.returnValue('default_scope');
    storeService.getVid.and.returnValue('41SLSP_ETH:ETH');

    await TestBed.configureTestingModule({
      imports: [EthProvenienzEraraLinkComponent],
      providers: [
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: { logError: jasmine.createSpy('logError'), logSyncError: jasmine.createSpy('logSyncError') } },
        { provide: TranslateService, useValue: { stream: () => of('') } },
        { provide: SHELL_ROUTER, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthProvenienzEraraLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('no links when it is not from eth_epics_provenienz', async () => {
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { source: ['Alma'] }
      }
    })));

    const links = await firstValueFrom(component.links$);

    expect(links.erara).toBeNull();
    expect(links.swisscovery).toBeNull();
  });


  it('builds swisscovery url from e-rara doi link', async () => {
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: {
          source: ['eth_epics_provenienz'],
          lds09: ['https://dx.doi.org/10.3931/e-rara-12345']
        }
      }
    })));

    const links = await firstValueFrom(component.links$);

    expect(links.erara).toBe('https://dx.doi.org/10.3931/e-rara-12345');
    expect(links.swisscovery).toBe('/search?query=10.3931/e-rara-12345&vid=41SLSP_ETH:ETH&tab=default_tab&search_scope=default_scope');
  });

  
  it('no swisscovery url when no matching e-rara link exists', async () => {
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: {
          source: ['eth_epics_provenienz'],
          lds09: ['https://example.com/other']
        }
      }
    })));

    const links = await firstValueFrom(component.links$);

    expect(links.erara).toBeNull();
    expect(links.swisscovery).toBeNull();
  });
});
