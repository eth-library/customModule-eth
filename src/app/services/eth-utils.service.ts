// eth-utils.service.ts
import { Injectable } from '@angular/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Injectable({
  providedIn: 'root'
})
export class EthUtilsService {

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService
  ){} 


  // sanitize html: Only a few html tags and attributes are allowed.
  sanitizeHtml(text: string | null): string | null {
    try {
      if (!text) return null;
      const allowedTags = ['a', 'strong', 'em', 'p', 'br','div'];
      const allowedAttributes: Record<string, string[]> = {
        a: ['href', 'target', 'rel'],
      };
      const safeProtocols = ['http:', 'https:', 'mailto:'];

      const div = document.createElement('div');
      div.innerHTML = text;
      div.querySelectorAll('*').forEach(el => {
        const tag = el.tagName.toLowerCase();
        if (!allowedTags.includes(tag)) {
          el.replaceWith(...Array.from(el.childNodes));
          return;
        }
        // Remove disallowed attributes (incl. event handlers)
        Array.from(el.attributes).forEach(attr => {
          const allowed = allowedAttributes[tag] ?? [];
          if (!allowed.includes(attr.name)) {
            el.removeAttribute(attr.name);
          }
        });
        // Validate href protocol and clean escaped quotes/backslashes
        if (tag === 'a') {
          let href = el.getAttribute('href');
          if (href) {
            // Remove backslash escapes inserted by external systems (e.g. \"https...\")
            href = href.replace(/\\+/g, '').trim();
            // Strip surrounding single or double quotes if present
            if ((href.startsWith('"') && href.endsWith('"')) || (href.startsWith("'") && href.endsWith("'"))) {
              href = href.slice(1, -1).trim();
            }
            // Write cleaned href back (will be validated below)
            el.setAttribute('href', href);

            try {
              const url = new URL(href, window.location.href);
              if (!safeProtocols.includes(url.protocol)) {
                el.removeAttribute('href');
              }
            } catch {
              el.removeAttribute('href');
            }
          }

          // Clean target attribute if it was escaped like \"_blank\"
          const target = el.getAttribute('target');
          if (target) {
            let cleanedTarget = target.replace(/\\+/g, '').trim();
            if ((cleanedTarget.startsWith('"') && cleanedTarget.endsWith('"')) || (cleanedTarget.startsWith("'") && cleanedTarget.endsWith("'"))) {
              cleanedTarget = cleanedTarget.slice(1, -1).trim();
            }
            el.setAttribute('target', cleanedTarget);
            // Add rel when opening in new tab
            if (cleanedTarget === '_blank' && !el.hasAttribute('rel')) {
              el.setAttribute('rel', 'noopener noreferrer');
            }
          }
        }
      });
      return div.innerHTML;
    }
    catch (error: unknown) {
      this.ethErrorHandlingService.logError(error, 'EthUtilsService.sanitizeHtml()');
      return null;
    }
  }


  /**
   * Moves a card element to a new location when the viewport is narrow (< 600px).
   * @param cardSelector CSS selector for the card (e.g., ‘.eth-place-cards’)
   */
  // It is not currently in use since the info cards in the right sidebar are responsive by default.
/*
  positionCard(cardSelector: string): ((e: MediaQueryListEvent) => void) | undefined {
    try{
      const move = (toMobile: boolean) => {
        const card = document.querySelector(cardSelector) as HTMLElement | null;
        const mobileTarget = document.querySelector('.recommendations') as HTMLElement | null;
        const fallbackMobileTarget = document.getElementById('nde.brief.results.tabs.explore');

        if (toMobile) {
          if (card && mobileTarget) {
            const clone = card.cloneNode(true); 
            mobileTarget.append(clone);
          }
          else if (card && fallbackMobileTarget && fallbackMobileTarget.parentNode) {
            const fallbackMobileTargetDOM = document.querySelector('.eth-recommendations-container ' + cardSelector) as HTMLElement | null;
            if(!fallbackMobileTargetDOM){
              const clone = card.cloneNode(true); 
              const wrapper = document.createElement('div');
              wrapper.style.setProperty('padding-inline', '1rem');
              wrapper.style.setProperty('margin-block-start', '1rem');
              wrapper.appendChild(clone);
              fallbackMobileTarget.parentNode?.insertBefore(wrapper, fallbackMobileTarget.nextSibling);
            }
          }
        }
      };

      const mq = window.matchMedia('(max-width: 599px)');
      let lastMatch = mq.matches;

      // intitial positioning
      setTimeout(() => move(lastMatch), 500);

      // listener for change of mq match
      const listener = (e: MediaQueryListEvent) => {
        if (e.matches !== lastMatch) {
          lastMatch = e.matches;
          setTimeout(() => move(e.matches), 500);
        }
      };
      mq.addEventListener('change', listener);
      return listener;
    }
    catch (error:unknown) {
      this.ethErrorHandlingService.logError(error, 'EthUtilsService.positionCard()');
      return undefined;
    }
  }
  */
}
