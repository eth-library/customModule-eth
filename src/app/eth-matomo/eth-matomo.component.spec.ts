import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { EthMatomoComponent } from './eth-matomo.component';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SHELL_ROUTER } from '../injection-tokens';

describe('EthMatomoComponent', () => {
  let component: EthMatomoComponent;
  let fixture: ComponentFixture<EthMatomoComponent>;
  let routerEvents$: Subject<any>;
  let routerMock: Partial<Router>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    routerEvents$ = new Subject<any>();
    routerMock = { events: routerEvents$.asObservable() };
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError',
      'logSyncError'
    ]);

    TestBed.configureTestingModule({
      imports: [EthMatomoComponent],
      providers: [
        { provide: SHELL_ROUTER, useValue: routerMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });
    fixture = TestBed.createComponent(EthMatomoComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('initializes matomo and tracks page views on navigation', () => {
    const appendChildSpy = spyOn(document.head, 'appendChild').and.callFake(<T extends Node>(node: T): T => {
      if (node instanceof HTMLScriptElement) {
        setTimeout(() => node.onload && node.onload(new Event('load')));
      }
      return node;
    });
    (window as any)._paq = [];

    component.ngOnInit();

    routerEvents$.next(new NavigationEnd(1, '/from', '/target'));

    expect(appendChildSpy).toHaveBeenCalled();
    expect((window as any)._paq.some((entry: any[]) => entry[0] === 'setTrackerUrl')).toBeTrue();
    expect((window as any)._paq.some((entry: any[]) => entry[0] === 'trackPageView')).toBeTrue();
  });


  it('skips script injection when matomo script already exists', () => {
    const script = document.createElement('script');
    script.src = 'https://library-ethz.opsone-analytics.ch/matomo.js';
    document.head.appendChild(script);

    const appendChildSpy = spyOn(document.head, 'appendChild').and.callThrough();

    component.ngOnInit();

    expect(appendChildSpy).not.toHaveBeenCalled();

    document.head.removeChild(script);
  });


  it('logs sync errors during init', () => {
    spyOn(document, 'querySelector').and.throwError('boom');

    component.ngOnInit();

    expect(errorHandlingSpy.logSyncError).toHaveBeenCalled();
  });
});
