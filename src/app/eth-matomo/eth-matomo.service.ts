import { Injectable } from '@angular/core';

type MatomoCommand = [string, ...unknown[]];
type MatomoWindow = Window & {
  _paq?: MatomoCommand[];
  __ETH_DEBUG_MATOMO__?: boolean;
  Piwik?: unknown;
  Matomo?: unknown;
};

@Injectable({
  providedIn: 'root',
})

export class EthMatomoService {

  private readonly maxInitChecks = 300;
  private readonly maxQueuedEvents = 200;
  private initialized = false;
  private disabled = false;
  private initChecks = 0;
  private checkTimeoutId: number | null = null;
  private queue: MatomoCommand[] = [];   // Events that are fired before Matomo is fully initialized

  private getWindow(): MatomoWindow {
    return window as MatomoWindow;
  }

  private isDebugEnabled(): boolean {
    return this.getWindow().__ETH_DEBUG_MATOMO__ === true;
  }

  private debugLog(...args: unknown[]): void {
    if (this.isDebugEnabled()) {
      console.log(...args);
    }
  }

  constructor() {
    // Ensure _paq exists (Matomo will normally create it, but we guarantee it early)
    const w = this.getWindow();
    w._paq = w._paq || [];

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

      const paq = this.getWindow()._paq;

      const hasPush = Array.isArray(paq);

      if (hasPush && this.matomoIsInitialized()) {
        this.initialized = true;
        this.flushQueue();
      } else {
        this.initChecks += 1;
        if (this.initChecks >= this.maxInitChecks) {
          this.disabled = true;
          this.queue = [];
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
    const w = this.getWindow();
    return !!(w.Piwik || w.Matomo);
  }

  /**
   * Flushes all queued events to the real Matomo tracker once it becomes ready.
   */
  private flushQueue() {
    const w = this.getWindow();
    w._paq = w._paq || [];
    const paq = w._paq;
    for (const entry of this.queue) {
      paq.push(entry);
    }
    this.queue = []; // Clear queue after flushing
  }

  /**
   * Pushes a tracking event into Matomo.
   * If Matomo is not ready yet, events are queued.
   */
  private push(event: MatomoCommand) {
    // Always ensure _paq exists
    const w = this.getWindow();
    w._paq = w._paq || [];

    if (this.disabled) {
      return;
    }

    if (this.initialized) {
      w._paq.push(event);
    } else {
      // Queue event until Matomo is ready
      if (this.queue.length >= this.maxQueuedEvents) {
        this.queue.shift();
      }
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
