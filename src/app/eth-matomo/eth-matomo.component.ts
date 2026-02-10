// Integration Matomo
// https://jira.ethz.ch/browse/SLSP-1954

import { DestroyRef, Component, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map, catchError, EMPTY, filter } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { SHELL_ROUTER } from "../injection-tokens";
import { Router } from '@angular/router';

@Component({
  selector: 'custom-eth-matomo',
  templateUrl: './eth-matomo.component.html',
  standalone: true,   
})

export class EthMatomoComponent implements OnInit {
  private router = inject(SHELL_ROUTER) as Router;

  private readonly trackerUrl = 'https://library-ethz.opsone-analytics.ch/';
  private readonly siteId = '66';
  private destroyRef = inject(DestroyRef);

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngOnInit() {
    try{
      if ((document.querySelector('script[src="' + this.trackerUrl + 'matomo.js"]'))) {
        console.log('Matomo script already loaded.');
        return;
      }
      
      (window as any)._paq = (window as any)._paq || [];

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
      this.ethErrorHandlingService.logSyncError(error, 'EthMatomoComponent.onInit()');
    }

  }

  private initializeTracking(): void {
    (window as any)._paq.push(['trackPageView']);
    (window as any)._paq.push(['enableLinkTracking']);
    this.router.events
      .pipe(
        takeUntilDestroyed(this.destroyRef),  
        filter((event: any) => 'urlAfterRedirects' in event && typeof event.urlAfterRedirects === 'string'),
        map(event => { return event.urlAfterRedirects; }),        
        distinctUntilChanged(),
        catchError(error => {
          this.ethErrorHandlingService.logError(error,'EthMatomoComponent.initializeTracking');
          return EMPTY;
        })
      )
      .subscribe(url => {
        (window as any)._paq.push(['setCustomUrl', url]);
        (window as any)._paq.push(['trackPageView']);
        console.log('Tracking PageView:', url);
      });
  }

}
  

