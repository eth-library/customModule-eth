import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { of, firstValueFrom } from 'rxjs';
import { EthComposeEraraComponent } from './eth-compose-erara.component';
import { EthComposeEraraService } from './eth-compose-erara.service';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { SHELL_ROUTER } from '../../injection-tokens';

describe('EthComposeEraraComponent', () => {
  let component: EthComposeEraraComponent;
  let fixture: ComponentFixture<EthComposeEraraComponent>;
  let composeServiceSpy: jasmine.SpyObj<EthComposeEraraService>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let routerSpy: jasmine.SpyObj<Router>;
  const translateMock: Partial<TranslateService> = { stream: () => of('label') };

  beforeEach(async () => {
    composeServiceSpy = jasmine.createSpyObj<EthComposeEraraService>('EthComposeEraraService', [
      'getOnlineEraraRecord',
      'getEraraRecordForEMap',
      'getEMapsRecord'
    ]);
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'isFullview$',
      'getFullDisplayRecord$',
      'getVid',
      'getTab',
      'getScope'
    ]);
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [EthComposeEraraComponent],
      providers: [
        { provide: EthComposeEraraService, useValue: composeServiceSpy },
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock as unknown as TranslateService },
        { provide: SHELL_ROUTER, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthComposeEraraComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('returns empty links when no MMS id exists', async () => {
    storeSpy.isFullview$.and.returnValue(of(true));
    storeSpy.getFullDisplayRecord$.and.returnValue(of({} as any));

    const result = await firstValueFrom(component.links$);

    expect(result).toEqual([]);
  });


  it('builds print and online links for e-maps record', async () => {
    storeSpy.getVid.and.returnValue('VID');
    storeSpy.getTab.and.returnValue('TAB');
    storeSpy.getScope.and.returnValue('SCOPE');
    storeSpy.isFullview$.and.returnValue(of(true));

    composeServiceSpy.getEraraRecordForEMap.and.returnValue(of([
      { _fields: ['ignored', 'print123'] }
    ] as any));
    composeServiceSpy.getOnlineEraraRecord.and.returnValue(of({
      docs: [{ pnx: { control: { sourcerecordid: ['online456'] } } }]
    } as any));

    const record = {
      pnx: {
        display: {
          mms: ['emap1'],
          type: ['map'],
          lds50: ['E01emaps']
        },
        control: { sourcesystem: ['Other'] }
      }
    } as any;

    storeSpy.getFullDisplayRecord$.and.returnValue(of(record));

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(2);
    expect(result[0].url).toContain('docid=almaprint123');
    expect(result[1].url).toContain('docid=almaonline456');
  });


  it('builds print link for digital record with print reference', async () => {
    storeSpy.getVid.and.returnValue('VID');
    storeSpy.getTab.and.returnValue('TAB');
    storeSpy.getScope.and.returnValue('SCOPE');
    storeSpy.isFullview$.and.returnValue(of(true));

    const record = {
      pnx: {
        display: {
          mms: ['digital1'],
          type: ['book'],
          lds09: ['MMS_ID_PRINT_990042488650205503']
        },
        control: { sourcesystem: ['Other'] }
      }
    } as any;

    storeSpy.getFullDisplayRecord$.and.returnValue(of(record));

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(1);
    expect(result[0].url).toContain('docid=alma990042488650205503');
  });
  

  it('builds emaps and online links for print erara record', async () => {
    storeSpy.getVid.and.returnValue('VID');
    storeSpy.getTab.and.returnValue('TAB');
    storeSpy.getScope.and.returnValue('SCOPE');
    storeSpy.isFullview$.and.returnValue(of(true));

    composeServiceSpy.getEMapsRecord.and.returnValue(of([
      { _fields: ['emap123', 'https://emaps.example.test/file.tif'] }
    ] as any));
    composeServiceSpy.getOnlineEraraRecord.and.returnValue(of({
      docs: [{ pnx: { control: { sourcerecordid: ['online789'] } } }]
    } as any));

    const record = {
      pnx: {
        display: {
          mms: ['990042488650205503'],
          type: ['map']
        },
        control: { sourcesystem: ['ILS'] }
      }
    } as any;

    storeSpy.getFullDisplayRecord$.and.returnValue(of(record));

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(3);
    expect(result[0]).toEqual({ label$: component.labelGeoTIFF$, url: 'https://emaps.example.test/file.tif', external: true });
    expect(result[1].url).toContain('docid=almaemap123');
    expect(result[2].url).toContain('docid=almaonline789');
  });
  

  it('navigates via router for internal links', () => {
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate('/fulldisplay?docid=alma123', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/fulldisplay?docid=alma123');
  });
});
