import { Component, ViewEncapsulation, OnInit, OnDestroy, Renderer2, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'custom-eth-theme',
  standalone: true,
  imports: [],
  templateUrl: './eth-theme.component.html',
  styleUrls: ['./eth-theme.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EthThemeComponent implements OnInit, OnDestroy {
  private linkEl?: HTMLLinkElement;
  private linkEl2?: HTMLLinkElement;
  private document = inject(DOCUMENT);
  private renderer = inject(Renderer2);

  ngOnInit(): void {
    try {
      const externalCss = 'https://daas.library.ethz.ch/addon/eth/custom.css';
      const already = Array.from(this.document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      if (!already.some(l => l.href === externalCss)) {
        const externalLink = this.renderer.createElement('link') as HTMLLinkElement;
        this.renderer.setAttribute(externalLink, 'rel', 'stylesheet');
        this.renderer.setAttribute(externalLink, 'href', externalCss);
        this.renderer.appendChild(this.document.head, externalLink);
        this.linkEl = externalLink;
      }
      const externalCss2 = 'https://daas.library.ethz.ch/addon/eth/assets/css/custom.css';
      const already2 = Array.from(this.document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
      if (!already2.some(l => l.href === externalCss2)) {
        const externalLink2 = this.renderer.createElement('link') as HTMLLinkElement;
        this.renderer.setAttribute(externalLink2, 'rel', 'stylesheet');
        this.renderer.setAttribute(externalLink2, 'href', externalCss2);
        this.renderer.appendChild(this.document.head, externalLink2);
        this.linkEl2 = externalLink2;
      }
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    if (this.linkEl) {
      try { this.renderer.removeChild(this.document.head, this.linkEl); } catch { }
      this.linkEl = undefined;
    }
    if (this.linkEl2) {
      try { this.renderer.removeChild(this.document.head, this.linkEl2); } catch { }
      this.linkEl2 = undefined;
    }
  }
}
