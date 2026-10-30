// Integration Matomo
// https://jira.ethz.ch/browse/SLSP-1954

import { ChangeDetectionStrategy, DestroyRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, catchError, EMPTY, filter } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SHELL_ROUTER } from "../injection-tokens";
import { EventType, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'custom-eth-matomo',
  templateUrl: './eth-matomo.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})


export class EthMatomoComponent implements OnInit {
  private router = inject(SHELL_ROUTER) as Router;
  private readonly trackerUrl = 'https://library-ethz.opsone-analytics.ch/';
  private readonly siteId = '66';
  private destroyRef = inject(DestroyRef);
  private trackingInitialized = false;
  private ethErrorHandlingService = inject(EthErrorHandlingService);

  ngOnInit() {
    try{
      (window as any)._paq = (window as any)._paq || [];

      if ((document.querySelector('script[src="' + this.trackerUrl + 'matomo.js"]'))) {
        this.initializeTracking();
        return;
      }

      // configure matomo
      (window as any)._paq.push(['setTrackerUrl', `${this.trackerUrl}matomo.php`]);
      (window as any)._paq.push(['setSiteId', this.siteId]);

      // load script
      const matomoScript = document.createElement('script');
      matomoScript.type = 'text/javascript';
      matomoScript.async = true;
      matomoScript.src = `${this.trackerUrl}matomo.js`;
      document.head.appendChild(matomoScript);

      matomoScript.onload = () => {
        console.log('Matomo script loaded successfully');
        // initialize automatic page tracking after script is ready
        this.initializeTracking();
      };
      matomoScript.onerror = () => {
        console.error('Failed to load Matomo script');
        this.ethErrorHandlingService.logError('Failed to load Matomo script', 'EthMatomoComponent.ngOnInit()');
      };

    }
    catch (error) {
      this.ethErrorHandlingService.logError(error, 'EthMatomoComponent.onInit()');
    }

  }

  private initializeTracking(): void {
    if (this.trackingInitialized) {
      return;
    }
    this.trackingInitialized = true;

    (window as any)._paq.push(['trackPageView']);
    (window as any)._paq.push(['enableLinkTracking']);
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),  
        filter((event): event is NavigationEnd => event.type === EventType.NavigationEnd),
        map(event => event.urlAfterRedirects),
        distinctUntilChanged(),
        catchError(error => {
          this.ethErrorHandlingService.logError(error,'EthMatomoComponent.initializeTracking');
          return EMPTY;
        })
      )
      .subscribe(url => {
        // Der Titel wird vom Host erst nach NavigationEnd gesetzt
        setTimeout(() => {
          const paq = (window as any)._paq;
          paq.push(['setCustomUrl', url]);
          paq.push(['setDocumentTitle', document.title]);
          paq.push(['trackPageView']);
        }, 500);
      });
  }
}