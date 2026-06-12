import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Component({
  selector: 'custom-eth-chat',
  standalone: true,
  imports: [],
  templateUrl: './eth-chat.component.html',
  styleUrl: './eth-chat.component.scss'
})

export class EthChatComponent implements OnInit, OnDestroy {
  private readonly scriptUrlByLang: Record<string, string> = {
    de: 'https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/8140594cc7f34becb6378bc777e4b7f73d016a19bc4c4331a8425fe90b30aa2f.js',
    en: 'https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/9837dd46fb5a4969910c0e385d7c6f823c041f76db1d4556b6fea6e062ffa0b2.js'
  };
  private langChangeSub?: Subscription;

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    try {
      const initialLang = this.translate.currentLang || 'de';
      this.loadScript(initialLang);

      this.langChangeSub = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
        this.swapScript(event.lang);
      });
    } catch (error) {
      this.ethErrorHandlingService.logError(error, 'EthChatComponent.ngOnInit()');
    }
  }

  ngOnDestroy(): void {
    this.langChangeSub?.unsubscribe();
    this.removeExistingScripts();
  }

  private swapScript(lang: string): void {
    this.removeExistingScripts();
    this.loadScript(lang);
  }

  private loadScript(lang: string): void {
    const scriptUrl = this.scriptUrlByLang[lang] ?? this.scriptUrlByLang['de'];

    if (!scriptUrl) {
      this.ethErrorHandlingService.logError(`No chat script configured for language: ${lang}`, 'EthChatComponent.loadScript()');
      return;
    }

    if (document.querySelector(`script[src="${scriptUrl}"]`)) {
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = scriptUrl;

    script.onerror = () => {
      const message = `Failed to load Chat script for language ${lang}`;
      console.error(message);
      this.ethErrorHandlingService.logError(message, 'EthChatComponent.loadScript()');
    };

    document.head.appendChild(script);
  }

  private removeExistingScripts(): void {
    Object.values(this.scriptUrlByLang).forEach(url => {
      const script = document.querySelector(`script[src="${url}"]`);
      script?.parentElement?.removeChild(script);
    });
  }
}
