import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { EthComposeNbComponent } from './eth-compose-nb.component';
import { EthComposeNbService } from './eth-compose-nb.service';
import { EthStoreService } from '../../services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { SHELL_ROUTER } from '../../injection-tokens';
import { PnxDoc, Sourcesystem } from '../../models/eth.model';

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

describe('EthComposeNbComponent', () => {
  let component: EthComposeNbComponent;
  let fixture: ComponentFixture<EthComposeNbComponent>;
  let composeService: jasmine.SpyObj<EthComposeNbService>;
  let storeService: jasmine.SpyObj<EthStoreService>;

  beforeEach(async () => {
    composeService = jasmine.createSpyObj<EthComposeNbService>('EthComposeNbService', [
      'getPrintData',
      'getOnlineData'
    ]);

    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'isFullview$',
      'getFullDisplayRecord$',
      'getVid',
      'getTab',
      'getScope'
    ]);

    storeService.getVid.and.returnValue('41SLSP_ETH:ETH');
    storeService.getTab.and.returnValue('default_tab');
    storeService.getScope.and.returnValue('default_scope');

    await TestBed.configureTestingModule({
      imports: [EthComposeNbComponent],
      providers: [
        { provide: EthComposeNbService, useValue: composeService },
        { provide: EthStoreService, useValue: storeService },
        {
          provide: TranslateService,
          useValue: {
            stream: (key: string) => of(key === 'eth.composeNb.online' ? 'Online' : 'Print')
          }
        },
        {
          provide: EthErrorHandlingService,
          useValue: { logError: jasmine.createSpy('logError') }
        },
        { provide: SHELL_ROUTER, useValue: { navigateByUrl: jasmine.createSpy('navigateByUrl') } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthComposeNbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('builds a print link when source is online/ eth_nachlassbibliothek', async () => {
    storeService.isFullview$.and.returnValue(of(true));
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { source: ['eth_nachlassbibliothek'] },
        control: { originalsourceid: ['oai:agora.ch:004261444_08'] }
      }
    })));

    composeService.getPrintData.and.returnValue(of({
      map: [{ almaSearch: '99118814985305503' }]
    }));

    const links = await firstValueFrom(component.links$);

    expect(links.length).toBe(1);
    expect(links[0].url).toContain('docid=alma99118814985305503');
    expect(links[0].sortKey).toBe('Print');
  });


  it('builds sorted online links when source is Alma / Print', async () => {
    storeService.isFullview$.and.returnValue(of(true));
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { source: ['Alma'], lds02: ['004261444_08(NEBIS)EBI01'] }
      }
    })));


    composeService.getOnlineData.and.returnValue(of({
      docs: [
        buildPnxDoc({
          pnx: {
            control: { sourcerecordid: ['990044649040205503'] },
            display: { title: ['Band 2'] }
          }
        }),
        buildPnxDoc({
          pnx: {
            control: { sourcerecordid: ['990044649040205504'] },
            display: { title: ['Band 1'] }
          }
        })
      ]
    }));

    const links = await firstValueFrom(component.links$);

    expect(links.length).toBe(2);
    expect(links[0].sortKey).toBe('Band 1');
    expect(links[1].sortKey).toBe('Band 2');
    expect(links[0].url).toContain('docid=alma990044649040205504');
  });


  it('online links: sorts by band number', () => {
    const docs = [
      buildPnxDoc({
        pnx: {
          control: { sourcerecordid: ['990044649040205503'] },
          display: { title: ['Band 2'] }
        }
      }),
      buildPnxDoc({
        pnx: {
          control: { sourcerecordid: ['990044649040205504'] },
          display: { title: ['Band 1'] }
        }
      }),
      buildPnxDoc({
        pnx: {
          control: { sourcerecordid: [] },
          display: { title: ['Band 3'] }
        }
      })
    ];

    const links = (component as any).mapOnlineDocs(docs);

    expect(links.length).toBe(2);
    expect(links[0].sortKey).toBe('Band 1');
    expect(links[1].sortKey).toBe('Band 2');
  });


  it('makePrimoUrl composes expected full display url', () => {
    storeService.getVid.and.returnValue('41SLSP_ETH:ETH');
    storeService.getTab.and.returnValue('default_tab');
    storeService.getScope.and.returnValue('default_scope');

    const url = (component as any).makePrimoUrl('99118814985305503');

    expect(url).toBe('/fulldisplay?vid=41SLSP_ETH:ETH&docid=alma99118814985305503&tab=default_tab&search_scope=default_scope');
  });
});
