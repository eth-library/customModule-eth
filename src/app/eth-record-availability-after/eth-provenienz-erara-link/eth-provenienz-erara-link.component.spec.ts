import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { EthProvenienzEraraLinkComponent } from './eth-provenienz-erara-link.component';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { PnxDoc, Sourcesystem, ProvenanceEraraLinksVM } from '../../models/eth.model';
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
  let errorHandlingService: jasmine.SpyObj<EthErrorHandlingService>;
  let router: { navigateByUrl: jasmine.Spy };

  beforeEach(async () => {
    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getFullDisplayRecord$',
      'getTab',
      'getScope',
      'getVid'
    ]);
    errorHandlingService = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError', 'logSyncError']);
    router = { navigateByUrl: jasmine.createSpy('navigateByUrl') };

    storeService.getTab.and.returnValue('default_tab');
    storeService.getScope.and.returnValue('default_scope');
    storeService.getVid.and.returnValue('41SLSP_ETH:ETH');
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { source: ['eth_epics_provenienz'], lds09: [] }
      }
    })));

    await TestBed.configureTestingModule({
      imports: [EthProvenienzEraraLinkComponent],
      providers: [
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingService },
        { provide: TranslateService, useValue: { stream: () => of('') } },
        { provide: SHELL_ROUTER, useValue: router }
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

    const links: ProvenanceEraraLinksVM = await firstValueFrom(component.links$);

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

    const links: ProvenanceEraraLinksVM = await firstValueFrom(component.links$);

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

    const links: ProvenanceEraraLinksVM = await firstValueFrom(component.links$);

    expect(links.erara).toBeNull();
    expect(links.swisscovery).toBeNull();
  });


  it('returns null links when lds09 data is missing', async () => {
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { source: ['eth_epics_provenienz'] }
      }
    })));

    const links: ProvenanceEraraLinksVM = await firstValueFrom(component.links$);

    expect(links.erara).toBeNull();
    expect(links.swisscovery).toBeNull();
  });


  it('logs and recovers when record stream errors', async () => {
    const boom = new Error('boom');
    errorHandlingService.logError.calls.reset();
    storeService.getFullDisplayRecord$.and.returnValue(throwError(() => boom));

    const links: ProvenanceEraraLinksVM = await firstValueFrom(component.links$);

    expect(links.erara).toBeNull();
    expect(links.swisscovery).toBeNull();
    expect(errorHandlingService.logError).toHaveBeenCalledWith(boom, 'EthProvenienzEraraLinkComponent.links$');
  });


  it('logs sync errors surfaced inside getLinks', async () => {
    const doc = buildPnxDoc({
      pnx: {
        display: {
          source: ['eth_epics_provenienz'],
          lds09: ['https://dx.doi.org/10.3931/e-rara-12345']
        }
      }
    });
    errorHandlingService.logSyncError.calls.reset();
    spyOn<any>(component, 'getEraraLink').and.callFake(() => {
      throw new Error('explode');
    });

    const links: ProvenanceEraraLinksVM = await firstValueFrom((component as any).getLinks(doc));

    expect(links.erara).toBeNull();
    expect(links.swisscovery).toBeNull();
    expect(errorHandlingService.logSyncError).toHaveBeenCalledWith(jasmine.any(Error), 'EthProvenienzEraraLinkComponent.getLinks');
  });


  it('returns null swisscovery url when DOI segment is missing', () => {
    const url = (component as any).makeSwisscoveryUrl('https://example.com/no-doi');

    expect(url).toBeNull();
  });


  it('finds first matching DOI link in lds09 array', () => {
    const result = (component as any).getEraraLink([
      'https://example.com/foo',
      'https://dx.doi.org/10.3931/e-rara-1',
      'https://dx.doi.org/10.3931/e-rara-2'
    ]);

    expect(result).toBe('https://dx.doi.org/10.3931/e-rara-1');
  });


  it('navigates via router while preventing default', () => {
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate('/target', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/target');
  });
});
