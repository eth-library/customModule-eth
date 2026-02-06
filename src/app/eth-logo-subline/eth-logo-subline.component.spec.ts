import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { EthLogoSublineComponent } from './eth-logo-subline.component';
import { SHELL_ROUTER } from '../injection-tokens';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from 'src/app/services/eth-error-handling.service';

describe('EthLogoSublineComponent', () => {
  let component: EthLogoSublineComponent;
  let fixture: ComponentFixture<EthLogoSublineComponent>;
  let routerSpy: jasmine.SpyObj<Router>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  const translateMock = { currentLang: 'de' } as TranslateService;

  beforeEach(async () => {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', ['getVid']);
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logSyncError']);

    await TestBed.configureTestingModule({
      imports: [EthLogoSublineComponent],
      providers: [
        { provide: SHELL_ROUTER, useValue: routerSpy },
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLogoSublineComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('builds the home url on init', () => {
    storeSpy.getVid.and.returnValue('41SLSP_ETH:ETH');
    translateMock.currentLang = 'en';

    component.ngOnInit();

    expect(component.url).toBe('/home?lang=en&vid=41SLSP_ETH:ETH');
  });


  it('falls back to default language when currentLang is missing', () => {
    storeSpy.getVid.and.returnValue('41SLSP_ETH:ETH');
    translateMock.currentLang = undefined as any;

    component.ngOnInit();

    expect(component.url).toBe('/home?lang=de&vid=41SLSP_ETH:ETH');
  });


  it('logs sync errors when url building fails', () => {
    storeSpy.getVid.and.throwError('boom');

    component.ngOnInit();

    expect(errorHandlingSpy.logSyncError).toHaveBeenCalled();
    expect(component.url).toBe('');
  });


  it('navigates to the built url', () => {
    component.url = '/home?lang=de&vid=NDE';
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/home?lang=de&vid=NDE');
  });


  it('does not navigate when url is empty', () => {
    component.url = '';
    const event = { preventDefault: jasmine.createSpy('preventDefault') } as unknown as Event;

    component.navigate(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

});
