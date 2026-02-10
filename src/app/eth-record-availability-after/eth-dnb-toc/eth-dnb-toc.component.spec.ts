import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { EthDnbTocComponent } from './eth-dnb-toc.component';
import { EthDnbTocService } from './eth-dnb-toc.service';
import { EthStoreService } from '../../services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { PnxDoc, Sourcesystem } from '../../models/eth.model';

type PnxDocOverrides = {
  pnx?: {
    display?: NonNullable<PnxDoc['pnx']>['display'];
    addata?: NonNullable<PnxDoc['pnx']>['addata'];
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

describe('EthDnbTocComponent', () => {
  let component: EthDnbTocComponent;
  let fixture: ComponentFixture<EthDnbTocComponent>;
  let dnbTocService: jasmine.SpyObj<EthDnbTocService>;
  let storeService: jasmine.SpyObj<EthStoreService>;

  beforeEach(async () => {
    dnbTocService = jasmine.createSpyObj<EthDnbTocService>('EthDnbTocService', [
      'getTocLink'
    ]);

    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'isFullview$',
      'getFullDisplayDeliveryEntity$',
      'getFullDisplayRecord$'
    ]);

    await TestBed.configureTestingModule({
      imports: [EthDnbTocComponent],
      providers: [
        { provide: EthDnbTocService, useValue: dnbTocService },
        { provide: EthStoreService, useValue: storeService },
        {
          provide: TranslateService,
          useValue: {
            stream: (key: string) => of(key === 'eth.dnbToc.toc' ? 'TOC' : 'TEXT')
          }
        },
        {
          provide: EthErrorHandlingService,
          useValue: { logError: jasmine.createSpy('logError') }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthDnbTocComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('returns alma links when alma links are present', async () => {
    storeService.isFullview$.and.returnValue(of(true));
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: {
        link: [
          { linkType: 'linktorsrc', displayLabel: 'TOC', linkURL: 'https://example.com/toc' },
          { linkType: 'linktorsrc', displayLabel: '$$Elinktorsrc', linkURL: 'https://example.com/skip' }
        ]
      }
    }));

    const result = await firstValueFrom(component.contentLinks$);

    expect(result?.almaLinks.length).toBe(1);
    expect(result?.dnbLinks.length).toBe(0);
    expect(result?.almaLinks[0].uri).toBe('https://example.com/toc');
  });


  it('returns dnb links when no alma links exist', async () => {
    storeService.isFullview$.and.returnValue(of(true));
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({ delivery: { link: [] } }));
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { title: ['My Title'] },
        addata: { isbn: ['9783715550527'] }
      }
    })));

    dnbTocService.getTocLink.and.returnValue(of({
      identifier: '9783715550527',
      links: [
        { uri: 'https://dnb.example/toc', partOfResource: 'Inhaltsverzeichnis', title: 'My Title' },
        { uri: 'https://dnb.example/text', partOfResource: 'Inhaltstext', title: 'Other Title' }
      ]
    }));

    const result = await firstValueFrom(component.contentLinks$);

    expect(result?.almaLinks.length).toBe(0);
    expect(result?.dnbLinks.length).toBe(2);
    expect(result?.dnbLinks[0].label).toBe('TOC');
    expect(result?.dnbLinks[0].title).toBeNull();
    expect(result?.dnbLinks[1].label).toBe('TEXT');
    expect(result?.dnbLinks[1].title).toBe('Other Title');
  });


  it('dedupes dnb links by uri', async () => {
    storeService.isFullview$.and.returnValue(of(true));
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({ delivery: { link: [] } }));
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { title: ['My Title'] },
        addata: { isbn: ['9783715550527'] }
      }
    })));

    dnbTocService.getTocLink.and.returnValue(of({
      identifier: '9783715550527',
      links: [
        { uri: 'https://dnb.example/toc', partOfResource: 'Inhaltsverzeichnis', title: 'My Title' },
        { uri: 'https://dnb.example/toc', partOfResource: 'Inhaltsverzeichnis', title: 'My Title' }
      ]
    }));

    const result = await firstValueFrom(component.contentLinks$);

    expect(result?.dnbLinks.length).toBe(1);
    expect(result?.dnbLinks[0].uri).toBe('https://dnb.example/toc');
  });


  it('normalizes titles and clears matches to the record title', async () => {
    storeService.isFullview$.and.returnValue(of(true));
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({ delivery: { link: [] } }));
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        display: { title: ['My Title'] },
        addata: { isbn: ['9783715550527'] }
      }
    })));

    dnbTocService.getTocLink.and.returnValue(of({
      identifier: '9783715550527',
      links: [
        { uri: 'https://dnb.example/toc', partOfResource: 'Inhaltsverzeichnis', title: '  My Title  ' }
      ]
    }));

    const result = await firstValueFrom(component.contentLinks$);

    expect(result?.dnbLinks.length).toBe(1);
    expect(result?.dnbLinks[0].title).toBeNull();
  });
});
