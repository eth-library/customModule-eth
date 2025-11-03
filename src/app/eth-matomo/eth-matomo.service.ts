import { Injectable, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, map, Subscription, catchError, of, EMPTY, filter } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Injectable({
  providedIn: 'root',
})

export class EthMatomoService implements OnDestroy{
  private trackerUrl = 'https://library-ethz.opsone-analytics.ch/';
  private siteId = '66';
  private initialized = new BehaviorSubject<boolean>(false);
  private routerSubscription?: Subscription;
  
  constructor(
    private router: Router,
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService,
  ) {}

  public loadMatomo(): void {
    if ((document.querySelector('script[src="' + this.trackerUrl + 'matomo.js"]'))) {
      console.log("Matomo script already loaded.");
      return;
    }
    
    (window as any)._paq = (window as any)._paq || [];

    // track initial load
    // (window as any)._paq.push(['trackPageView']); 

    // configure matomo
    (window as any)._paq.push(['setTrackerUrl', `${this.trackerUrl}matomo.php`]);
    (window as any)._paq.push(['setSiteId', this.siteId]);

    // initialize automatic page tracking 
    this.initializeTracking();

    // load script
    const matomoScript = document.createElement('script');
    matomoScript.type = 'text/javascript';
    matomoScript.async = true;
    matomoScript.src = `${this.trackerUrl}matomo.js`;
    document.head.appendChild(matomoScript);

    matomoScript.onload = () => {
      this.initialized.next(true);
      console.log('Matomo script loaded successfully');
    };
    matomoScript.onerror = () => {
      console.error('Failed to load Matomo script');
    };
    console.log("MatomoService instantiated", this)
  }

  private initializeTrackingOld(): void {
    (window as any)._paq.push(['trackPageView']);
    (window as any)._paq.push(['enableLinkTracking']);
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        (window as any)._paq.push(['setCustomUrl', event.urlAfterRedirects]);
        (window as any)._paq.push(['trackPageView']);
        console.log('Tracking PageView: ', event.urlAfterRedirects);
      }
    });
  }

  private initializeTracking(): void {
    (window as any)._paq.push(['trackPageView']);
    (window as any)._paq.push(['enableLinkTracking']);

    this.ethStoreService.getRouter$().pipe(
      map(state => state?.url),
      distinctUntilChanged(),
      filter(Boolean), 
      catchError(error => {
        this.ethErrorHandlingService.handleError(error,'EthMatomoService.initializeTracking');
        return EMPTY; 
      })
    ).subscribe(url => {
      (window as any)._paq.push(['setCustomUrl', url]);
      (window as any)._paq.push(['trackPageView']);
      console.log('Matomo:', url);
    });
  }

  // method for event tracking
  trackEvent(category?: string, action?: string, name?: string, value?: number): void {
    if (this.initialized.value && (window as any)._paq) {
      const eventCategory = category || 'defaultCategory';   
      const eventAction = action || 'defaultAction';        
      const eventName = name || 'defaultName';              
      const eventValue = value !== undefined ? value : 0;   
      (window as any)._paq.push(['trackEvent', eventCategory, eventAction, eventName, eventValue]);
    } else {
      console.warn('Matomo tracker not initialized');
    }
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }
  
}
