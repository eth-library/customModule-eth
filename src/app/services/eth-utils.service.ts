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


  // sanitize text. Only a few html tags are valid.
  sanitizeText(text: string | null): string | null {
    try{
      if (!text) return null;
      const allowedTags = ['a', 'strong', 'em', 'p', 'br'];
      const div = document.createElement('div');
      div.innerHTML = text;
      div.querySelectorAll('*').forEach(el => {
        if (!allowedTags.includes(el.tagName.toLowerCase())) {
          el.replaceWith(...Array.from(el.childNodes));
        }
      });
      return div.innerHTML;
    }
    catch (error:unknown) {
      this.ethErrorHandlingService.logSyncError(error, 'EthUtilsService.sanitizeText()');
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
      this.ethErrorHandlingService.logSyncError(error, 'EthUtilsService.positionCard()');
      return undefined;
    }
  }
  */
}
