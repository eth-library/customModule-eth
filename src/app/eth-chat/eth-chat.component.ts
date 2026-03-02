import { Component, OnInit, inject } from '@angular/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

@Component({
  selector: 'custom-eth-chat',
  standalone: true,
  imports: [],
  templateUrl: './eth-chat.component.html',
  styleUrl: './eth-chat.component.scss'
})

export class EthChatComponent implements OnInit {
  private readonly scriptUrl = 'https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/9837dd46fb5a4969910c0e385d7c6f823c041f76db1d4556b6fea6e062ffa0b2.js';

  constructor(
    private ethErrorHandlingService: EthErrorHandlingService
  ) { }

  ngOnInit() {
    try {
      if (document.querySelector(`script[src="${this.scriptUrl}"]`)) {
        return;
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.async = true;
      script.src = this.scriptUrl;

      script.onload = () => {
        // Chat script loaded
      };

      script.onerror = () => {
        console.error('Failed to load Chat script');
        this.ethErrorHandlingService.logError('Failed to load Chat script', 'EthChatComponent.ngOnInit()');
      };

      document.head.appendChild(script);
    } catch (error) {
      this.ethErrorHandlingService.logSyncError(error, 'EthChatComponent.ngOnInit()');
    }
  }
}
