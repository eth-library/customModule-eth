import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EthOnlineButtonComponent } from './eth-online-button.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SHELL_ROUTER } from '../injection-tokens';
import { firstValueFrom, of } from 'rxjs';

describe('EthOnlineButtonComponent', () => {
  let component: EthOnlineButtonComponent;
  let fixture: ComponentFixture<EthOnlineButtonComponent>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getRecord$',
      'getDeliveryEntity$'
    ]);
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logSyncError']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl', 'navigateByUrl'], {
      url: '/search?foo=bar'
    });
    routerSpy.parseUrl.and.returnValue({ queryParams: { foo: 'bar' } } as any);

    await TestBed.configureTestingModule({
      imports: [EthOnlineButtonComponent],
      providers: [
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: SHELL_ROUTER, useValue: routerSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOnlineButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('returns no online button when view model has online links', async () => {
    component.hostComponent = { viewModel$: of({ onlineLinks: [{}] }) } as any;
    storeSpy.getRecord$.and.returnValue(of({} as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({} as any));

    spyOn(component, 'removeOTBOnlineButton');
    spyOn(component, 'checkLibkeyButton');

    component.ngAfterViewInit();

    const result = await firstValueFrom(component.links$);

    expect(result).toEqual([]);
  });


  it('prefers electronic services and adds ViewIt link', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({ pnx: { control: { recordid: ['doc123'] } } } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: {
        electronicServices: [{ serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }]
      }
    } as any));

    spyOn(component, 'removeOTBOnlineButton');
    spyOn(component, 'checkLibkeyButton');

    component.ngAfterViewInit();

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(2);
    expect(result[0]).toEqual({ url: 'https://service.test', source: 'electronicServices' });
    expect(result[1].source).toBe('ViewIt');
    expect(result[1].url).toContain('docid=doc123');
  });


  it('uses linktorsrcadditional when no electronic services exist', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({
      pnx: {
        control: { recordid: ['doc123'] },
        links: { linktorsrcadditional: ['$$Uhttp://example.test$$Ddesc'] }
      }
    } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({ delivery: { electronicServices: [] } } as any));

    spyOn(component, 'removeOTBOnlineButton');
    spyOn(component, 'checkLibkeyButton');

    component.ngAfterViewInit();

    const result = await firstValueFrom(component.links$);

    expect(result[0]).toEqual({ url: 'http://example.test', source: 'pnx' });
  });


  it('does not add ViewIt link when docid is missing', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({ pnx: { control: { recordid: [] } } } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: { electronicServices: [{ serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }] }
    } as any));

    spyOn(component, 'removeOTBOnlineButton');
    spyOn(component, 'checkLibkeyButton');

    component.ngAfterViewInit();

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(1);
    expect(result[0].source).toBe('electronicServices');
  });


  it('navigates internally for ViewIt links', () => {
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate('ViewIt', '/fulldisplay?docid=doc123', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/fulldisplay?docid=doc123');
  });


});
