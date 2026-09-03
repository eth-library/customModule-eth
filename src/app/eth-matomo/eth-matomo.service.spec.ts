import { fakeAsync, tick } from '@angular/core/testing';
import { EthMatomoService } from './eth-matomo.service';

describe('EthMatomoService', () => {
  let originalPiwik: any;
  let originalMatomo: any;
  let originalDebugFlag: any;

  beforeEach(() => {
    originalPiwik = (window as any).Piwik;
    originalMatomo = (window as any).Matomo;
    originalDebugFlag = (window as any).__ETH_DEBUG_MATOMO__;

    delete (window as any).Piwik;
    delete (window as any).Matomo;
    delete (window as any).__ETH_DEBUG_MATOMO__;
    (window as any)._paq = [];
  });

  afterEach(() => {
    (window as any).Piwik = originalPiwik;
    (window as any).Matomo = originalMatomo;
    (window as any).__ETH_DEBUG_MATOMO__ = originalDebugFlag;
  });

  it('queues events before matomo is initialized and flushes when ready', fakeAsync(() => {
    const service = new EthMatomoService();

    service.trackEvent('cat', 'act', 'name', 1);
    expect((window as any)._paq.length).toBe(0);

    (window as any).Matomo = {};
    tick(250);

    expect((window as any)._paq.some((entry: any[]) => entry[0] === 'trackEvent')).toBeTrue();
  }));

  it('pushes events immediately when matomo is already initialized', fakeAsync(() => {
    (window as any).Matomo = {};
    const service = new EthMatomoService();
    tick(1);

    service.trackVirtualPage('/foo');

    expect((window as any)._paq.some((entry: any[]) => entry[0] === 'setCustomUrl')).toBeTrue();
    expect((window as any)._paq.some((entry: any[]) => entry[0] === 'trackPageView')).toBeTrue();
  }));

  it('logs only when debug flag is enabled', fakeAsync(() => {
    const logSpy = spyOn(console, 'log');

    (window as any).Matomo = {};
    const service = new EthMatomoService();
    tick(1);

    service.trackEvent('cat', 'act', 'name', 1);
    expect(logSpy).not.toHaveBeenCalled();

    (window as any).__ETH_DEBUG_MATOMO__ = true;
    service.trackVirtualPage('/debug');
    expect(logSpy).toHaveBeenCalled();
  }));

  it('stops polling and keeps queued events when matomo never initializes', fakeAsync(() => {
    const service = new EthMatomoService();

    service.trackEvent('cat', 'act', 'late', 1);
    tick(61000);

    expect((window as any)._paq.length).toBe(0);
  }));
});
