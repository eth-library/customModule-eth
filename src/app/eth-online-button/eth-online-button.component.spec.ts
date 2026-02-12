import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { EthOnlineButtonComponent } from './eth-online-button.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SHELL_ROUTER } from '../injection-tokens';
import { Subject, firstValueFrom, of, take } from 'rxjs';

const translateServiceMock = {
  stream: (key: string) => of(key)
};

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
        { provide: SHELL_ROUTER, useValue: routerSpy },
        { provide: TranslateService, useValue: translateServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOnlineButtonComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('renders no online button when view model has online links (OTB Quicklinks)', async () => {
    component.hostComponent = { viewModel$: of({ onlineLinks: [{}] }) } as any;
    storeSpy.getRecord$.and.returnValue(of({} as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({} as any));

    spyOn(component, 'removeOTBOnlineButton');
    //spyOn(component, 'checkLibkeyButton');

    const result = await firstValueFrom(component.links$);

    expect(result).toEqual([]);
  });


  it('prefers electronic services over linktorsrcadditional and adds fullview viewIt link', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({ pnx: { control: { recordid: ['doc123'] } } } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: {
        electronicServices: [{ serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }]
      }
    } as any));

    spyOn(component, 'removeOTBOnlineButton');
    spyOn(component, 'checkLibkeyButton');

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

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(1);
    expect(result[0].source).toBe('electronicServices');
  });


  it('renders quicklink button', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({ pnx: { control: { recordid: ['doc123'] } } } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: {
        electronicServices: [{ serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }]
      }
    } as any));

    spyOn(component, 'removeOTBOnlineButton');
    //spyOn(component, 'checkLibkeyButton');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.debugElement.query(By.css('.eth-quicklink-container'));
    const mainButton = fixture.debugElement.query(By.css('.eth-quicklink-button'));
    const expandButton = fixture.debugElement.query(By.css('.eth-quicklink-expand-button'));
    const mainButtonText = (mainButton?.nativeElement as HTMLElement | null)?.textContent || '';

    expect(container).toBeTruthy();
    expect(mainButton).toBeTruthy();
    expect(expandButton).toBeTruthy();
    expect(mainButtonText.trim()).toContain('eth.onlineButton.linkText');
  });


  it('navigates for ViewIt links by navigateByUrl', () => {
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate('ViewIt', '/fulldisplay?docid=doc123', event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/fulldisplay?docid=doc123');
  });


  it('recomputes links when hostComponent changes', (done) => {
    const recordA$ = new Subject<any>();
    const deliveryA$ = new Subject<any>();
    const recordB$ = new Subject<any>();
    const deliveryB$ = new Subject<any>();

    storeSpy.getRecord$.and.callFake((host: any) => (host?.id === 'A' ? recordA$ : recordB$));
    storeSpy.getDeliveryEntity$.and.callFake((host: any) => (host?.id === 'A' ? deliveryA$ : deliveryB$));

    spyOn(component, 'removeOTBOnlineButton');

    const results: any[] = [];
    component.links$.pipe(take(2)).subscribe(value => {
      results.push(value);
      if (results.length === 2) {
        expect(results[0][0]).toEqual({ url: 'http://example.test', source: 'pnx' });
        expect(results[1][0]).toEqual({ url: 'https://service.test', source: 'electronicServices' });
        done();
      }
    });

    component.hostComponent = { id: 'A', viewModel$: of(null) } as any;
    recordA$.next({
      pnx: {
        control: { recordid: ['docA'] },
        links: { linktorsrcadditional: ['$$Uhttp://example.test$$Ddesc'] }
      }
    });
    deliveryA$.next({ delivery: { electronicServices: [] } });

    component.hostComponent = { id: 'B', viewModel$: of(null) } as any;
    recordB$.next({ pnx: { control: { recordid: ['docB'] } } });
    deliveryB$.next({ delivery: { electronicServices: [{ serviceUrl: 'https://service.test' }] } });
  });


});
