import { Component, OnInit } from '@angular/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

/**
 * Bindet den Lime Connect Website-Router ein. Der Router entscheidet anhand des
 * lang-Parameters in der URL, ob das deutsche oder das englische Widget geladen
 * wird - die Sprachlogik liegt in der Lime Connect Konfiguration, nicht hier.
 *
 * Der Router wertet auch bei URL-Aenderungen innerhalb der SPA neu aus und
 * tauscht das Widget dabei sauber aus (verifiziert: Mount-Frames bleiben konstant,
 * ein laufender Chat wird serverseitig wiederhergestellt und bleibt erhalten).
 *
 * Deshalb wird das Skript hier bewusst nur einmal geladen und nie wieder entfernt.
 * Kein manuelles Sprach-Swapping einbauen: Das Userlike-SDK bietet keine
 * Unmount-API, ein zweiter Skript-Aufruf hinterlaesst pro Sprachwechsel ein
 * verwaistes Mount-Iframe, und der Mount-Guard des SDK verhindert obendrein,
 * dass das sichtbare Widget die Sprache ueberhaupt wechselt.
 */
@Component({
  selector: 'custom-eth-chat',
  standalone: true,
  imports: [],
  templateUrl: './eth-chat.component.html',
  styleUrl: './eth-chat.component.scss'
})

export class EthChatComponent implements OnInit {
  private readonly routerScriptUrl = 'https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/9d7a3a39a18947d294a1dc2bfc2564e4db9f74187bd54ce6b0eaf86e9390bdd2.js';

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService
  ) { }

  ngOnInit(): void {
    try {
      if (document.querySelector(`script[src="${this.routerScriptUrl}"]`)) {
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = this.routerScriptUrl;

      script.onerror = () => {
        this.ethErrorHandlingService.logError(
          'Failed to load Lime Connect website router script',
          'EthChatComponent.ngOnInit()'
        );
      };

      // Lime Connect verlangt die Einbindung im body, nicht im head.
      document.body.appendChild(script);
    } catch (error) {
      this.ethErrorHandlingService.logError(error, 'EthChatComponent.ngOnInit()');
    }
  }
}
