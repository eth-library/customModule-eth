import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { By } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { EthOnlineButtonComponent } from './eth-online-button.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SHELL_ROUTER } from '../injection-tokens';
import { Subject, firstValueFrom, of, take, throwError } from 'rxjs';

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
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
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


  it('renders no online button when OOTB Quicklinks exists (viewModel$ has online links)', async () => {
    component.hostComponent = { viewModel$: of({ onlineLinks: [{}] }) } as any;
    storeSpy.getRecord$.and.returnValue(of({} as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({} as any));

    spyOn<any>(component, 'hideOOTBOnlineButton');
    spyOn<any>(component, 'observeLibkeyAppearance');

    const result = await firstValueFrom(component.links$);

    expect(result).toEqual([]);
  });


  it('renders no online button for Alma-D delivery category', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({
      pnx: {
        control: { recordid: ['99120192274305503'] },
        links: { linktorsrcadditional: ['$$Uhttp://example.test$$Ddesc'] }
      }
    } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: {
        deliveryCategory: ['Alma-D'],
        electronicServices: [{ serviceUrl: 'https://service.test' }]
      }
    } as any));

    const result = await firstValueFrom(component.links$);

    expect(result).toEqual([]);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.eth-quicklink-container'))).toBeNull();
  });


  it('renders no online button for Library Stack links', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({
      pnx: {
        control: { recordid: ['cdi_librarystack_primary_159090'] },
        links: { linktorsrcadditional: ['$$Uhttp://example.test$$Ddesc'] }
      }
    } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: {
        link: [{ linkURL: 'https://www.librarystack.org/item/159090' }],
        electronicServices: [{ serviceUrl: 'https://service.test' }]
      }
    } as any));

    const result = await firstValueFrom(component.links$);

    expect(result).toEqual([]);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.eth-quicklink-container'))).toBeNull();
  });


  it('check first electronic services and adds fullview viewIt link', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({ pnx: { control: { recordid: ['doc123'] } } } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: {
        electronicServices: [{ serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }]
      }
    } as any));

    spyOn<any>(component, 'hideOOTBOnlineButton');
    spyOn<any>(component, 'observeLibkeyAppearance');

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

    spyOn<any>(component, 'hideOOTBOnlineButton');
    spyOn<any>(component, 'observeLibkeyAppearance');

    const result = await firstValueFrom(component.links$);

    expect(result[0]).toEqual({ url: 'http://example.test', source: 'pnx' });
  });


  it('does not add ViewIt link when docid is missing', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;
    storeSpy.getRecord$.and.returnValue(of({ pnx: { control: { recordid: [] } } } as any));
    storeSpy.getDeliveryEntity$.and.returnValue(of({
      delivery: { electronicServices: [{ serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }] }
    } as any));

    spyOn<any>(component, 'hideOOTBOnlineButton');
    spyOn<any>(component, 'observeLibkeyAppearance');

    const result = await firstValueFrom(component.links$);

    expect(result.length).toBe(1);
    expect(result[0].source).toBe('electronicServices');
  });


  it('renders online button', async () => {
    component.hostComponent = { viewModel$: of(null) } as any;

    storeSpy.getRecord$.and.returnValue(
      of({ pnx: { control: { recordid: ['doc123'] } } } as any)
    );

    storeSpy.getDeliveryEntity$.and.returnValue(
      of({
        delivery: {
          electronicServices: [
            { serviceUrl: 'https://service.test', ilsApiId: 'alma_123' }
          ]
        }
      } as any)
    );

    spyOn<any>(component, 'hideOOTBOnlineButton');
    spyOn<any>(component, 'observeLibkeyAppearance');

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.debugElement.query(
      By.css('.eth-quicklink-container')
    );

    const mainButton = fixture.debugElement.query(
      By.css('.eth-quicklink-button')
    );

    const expandButton = fixture.debugElement.query(
      By.css('.eth-quicklink-expand-button')
    );

    const mainButtonText =
      (mainButton?.nativeElement as HTMLElement | null)?.textContent || '';

    expect(container).toBeTruthy();
    expect(mainButton).toBeTruthy();
    expect(expandButton).toBeTruthy();
    expect(mainButtonText.trim())
      .toContain('eth.onlineButton.linkText');
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

    spyOn<any>(component, 'hideOOTBOnlineButton');

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


  it('falls back to default viewModel observable and suppresses duplicate emissions', (done) => {
    const record$ = new Subject<any>();
    const delivery$ = new Subject<any>();

    storeSpy.getRecord$.and.returnValue(record$);
    storeSpy.getDeliveryEntity$.and.returnValue(delivery$);

    const received: any[] = [];
    const subscription = component.links$.subscribe(value => received.push(value));

    component.hostComponent = { id: 'X' } as any;

    const baseRecord = {
      pnx: { control: { recordid: ['doc123'] }, links: { linktorsrcadditional: ['$$Uhttp://example.test'] } }
    } as any;
    const deliveryPayload = { delivery: { electronicServices: [] } } as any;

    delivery$.next(deliveryPayload);
    record$.next(baseRecord);
    record$.next({ ...baseRecord });

    setTimeout(() => {
      expect(received.length).toBe(1);
      subscription.unsubscribe();
      done();
    }, 0);
  });


  it('logs sync errors and returns empty list when stream fails', (done) => {
    storeSpy.getRecord$.and.returnValue(throwError(() => new Error('boom')));
    storeSpy.getDeliveryEntity$.and.returnValue(of({} as any));
    errorHandlingSpy.logError.calls.reset();

    component.hostComponent = { viewModel$: of(null) } as any;

    component.links$.pipe(take(1)).subscribe(value => {
      expect(value).toEqual([]);
      expect(errorHandlingSpy.logError).toHaveBeenCalledWith(jasmine.any(Error), 'EthOnlineButtonComponent.links$');
      done();
    });
  });


  it('opens external links in a new tab', () => {
    const openSpy = spyOn(window, 'open');
    const event = new MouseEvent('click');

    component.navigate('pnx', 'https://example.test', event);

    expect(openSpy).toHaveBeenCalledWith('https://example.test', '_blank', 'noopener,noreferrer');
  });


  it('hides the default online availability button when custom links exist', () => {
    const container = document.createElement('div');
    const otb = document.createElement('nde-online-availability');
    container.appendChild(otb);
    const hostEl = { closest: () => container } as any;
    (component as any).elementRef = { nativeElement: hostEl };

    (component as any).hideOOTBOnlineButton();

    expect(otb.style.display).toBe('none');
  });
  it('observes libkey appearance and hides ETH online button when detected', () => {
    const container = document.createElement('div');
    const quicklink = document.createElement('div');
    quicklink.classList.add('eth-quicklink-container');
    container.appendChild(quicklink);
    const hostEl = { closest: () => container } as any;
    (component as any).elementRef = { nativeElement: hostEl };

    const originalObserver = (window as any).MutationObserver;
    const observeSpy = jasmine.createSpy('observe');
    const disconnectSpy = jasmine.createSpy('disconnect');
    let mutationCallback: ((m: MutationRecord[], obs: MutationObserver) => void) | null = null;

    class MutationObserverMock {
      constructor(cb: any) {
        mutationCallback = cb;
      }
      observe = observeSpy;
      disconnect = disconnectSpy;
    }
    (window as any).MutationObserver = MutationObserverMock as any;

    (component as any).observeLibkeyAppearance();

    expect(observeSpy).toHaveBeenCalledWith(container, { childList: true, subtree: true });

    const libkey = document.createElement('div');
    libkey.classList.add('ti-stack-options-container');
    container.appendChild(libkey);

    const callback = mutationCallback as ((m: MutationRecord[], obs: MutationObserver) => void) | null;
    callback?.([], { disconnect: disconnectSpy } as any);

    expect(quicklink.style.display).toBe('none');
    expect(disconnectSpy).toHaveBeenCalled();

    (window as any).MutationObserver = originalObserver;
  });


  it('disconnects and clears the libkey observer helper state', () => {
    const disconnectSpy = jasmine.createSpy('disconnect');

    (component as any).mutationObserver = {
      disconnect: disconnectSpy
    } as unknown as MutationObserver;

    (component as any).disconnectLibkeyObserver();

    expect(disconnectSpy).toHaveBeenCalled();
    expect((component as any).mutationObserver).toBeUndefined();
  });


});
