import { Component, ViewEncapsulation, OnInit, OnDestroy, Renderer2, Inject } from '@angular/core';
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

  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

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
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    if (this.linkEl) {
      try { this.renderer.removeChild(this.document.head, this.linkEl); } catch { }
      this.linkEl = undefined;
    }
  }
}
