import { DestroyRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, distinctUntilChanged, map, Subscription, catchError, of, EMPTY, filter } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
//import {SHELL_ROUTER} from "../../injection-tokens";

@Component({
  selector: 'custom-eth-matomo',
  templateUrl: './eth-matomo.component.html',
  styleUrls: ['./eth-matomo.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ]   
})

export class EthMatomoComponent {
  private trackerUrl = 'https://library-ethz.opsone-analytics.ch/';
  private siteId = '66';
  private initialized = new BehaviorSubject<boolean>(false);
  //private router = inject(SHELL_ROUTER);
  private destroyRef = inject(DestroyRef);

  constructor(
    private router: Router,
    private ethStoreService:EthStoreService,
    private ethErrorHandlingService: EthErrorHandlingService
  ) {}

  ngOnInit() {
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

    this.router.events
      .pipe(
        takeUntilDestroyed(),             
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        map(event => event.urlAfterRedirects),
        distinctUntilChanged(),
        catchError(error => {
          this.ethErrorHandlingService.handleError(error,'EthMatomoComponent.initializeTracking');
          return EMPTY;
        })
      )
      .subscribe(url => {
        (window as any)._paq.push(['setCustomUrl', url]);
        (window as any)._paq.push(['trackPageView']);
        console.log('Tracking PageView:', url);
      });
  }


  private initializeTracking(): void {
    (window as any)._paq.push(['trackPageView']);
    (window as any)._paq.push(['enableLinkTracking']);
    this.ethStoreService.getRouter$()
      .pipe(
          // only valid state
          map(state => state?.url),            
          filter((url): url is string => !!url),
          distinctUntilChanged(),
          takeUntilDestroyed(this.destroyRef),  
          catchError(error => {
            this.ethErrorHandlingService.handleError(error,'EthMatomoComponent.initializeTracking');
            return EMPTY;
          })
        )
        .subscribe(url => {
          (window as any)._paq.push(['setCustomUrl', url]);
          (window as any)._paq.push(['trackPageView']);
          console.log('Matomo:', url);
        });
      }
  }

