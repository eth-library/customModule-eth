import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})

export class EthMatomoService {

  private readonly maxInitChecks = 300;
  private initialized = false;
  private initChecks = 0;
  private checkTimeoutId: number | null = null;
  private queue: any[][] = [];   // Events that are fired before Matomo is fully initialized

  private isDebugEnabled(): boolean {
    return (window as any).__ETH_DEBUG_MATOMO__ === true;
  }

  private debugLog(...args: any[]): void {
    if (this.isDebugEnabled()) {
      console.log(...args);
    }
  }

  constructor() {
    // Ensure _paq exists (Matomo will normally create it, but we guarantee it early)
    (window as any)._paq = (window as any)._paq || [];

    // Detect when Matomo is fully initialized
    this.waitForMatomo();
  }

  /**
   * Repeatedly checks whether Matomo has initialized.
   * Matomo loads asynchronously, so initialization may occur late.
   */
  private waitForMatomo() {
    const check = () => {
      this.checkTimeoutId = null;

      if (this.initialized) {
        return;
      }

      const paq = (window as any)._paq;

      const hasPush =
        Array.isArray(paq) || typeof paq.push === 'function';

      if (hasPush && this.matomoIsInitialized()) {
        this.initialized = true;
        this.flushQueue();
      } else {
        this.initChecks += 1;
        if (this.initChecks >= this.maxInitChecks) {
          return;
        }
        // Retry until Matomo is ready (lightweight polling)
        this.checkTimeoutId = window.setTimeout(check, 200);
      }
    };

    if (this.checkTimeoutId === null) {
      check();
    }
  }

  /**
   * Checks whether Matomo has finished setting up its global tracker object.
   * This provides more certainty than just checking _paq.
   */
  private matomoIsInitialized(): boolean {
    const w = (window as any);
    return !!(w.Piwik || w.Matomo);
  }

  /**
   * Flushes all queued events to the real Matomo tracker once it becomes ready.
   */
  private flushQueue() {
    const paq = (window as any)._paq;
    for (const entry of this.queue) {
      paq.push(entry);
    }
    this.queue = []; // Clear queue after flushing
  }

  /**
   * Pushes a tracking event into Matomo.
   * If Matomo is not ready yet, events are queued.
   */
  private push(event: any[]) {
    // Always ensure _paq exists
    (window as any)._paq = (window as any)._paq || [];

    if (this.initialized) {
      (window as any)._paq.push(event);
    } else {
      // Queue event until Matomo is ready
      this.queue.push(event);
    }
  }

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  /**
   * Tracks a Matomo event.
   * 1) Send tracking event
   * this.matomo.trackEvent('Customizing','Click','personcard->personpage');
   *
   * 2) Navigate to new page
   * this.router.navigateByUrl('/bla/blub');
   */
  trackEvent(
    category: string = 'defaultCategory',
    action: string = 'defaultAction',
    name: string = 'defaultName',
    value: number = 0
  ): void {
    this.push(['trackEvent', category, action, name, value]);
    this.debugLog('Matomo event:', name);
  }

  /**
   * Tracks a virtual page view in Matomo.
   */
  trackVirtualPage(url: string): void {
    if (!url.startsWith('/')) url = '/' + url;
    this.push(['setCustomUrl', url]);
    this.push(['trackPageView']);
    this.debugLog('Matomo virtual page:', url);
  }
}
