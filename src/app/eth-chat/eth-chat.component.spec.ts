import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthChatComponent } from './eth-chat.component';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

const PRODUKTIV_URL = 'https://userlike-cdn-widgets.s3-eu-west-1.amazonaws.com/9d7a3a39a18947d294a1dc2bfc2564e4db9f74187bd54ce6b0eaf86e9390bdd2.js';

// Im Test wird die Router-URL ersetzt, damit Karma das echte Skript nicht vom
// CDN nachlaedt und kein Widget in die Testseite gemountet wird.
const TEST_URL = 'data:text/javascript,void%200';
const testScripts = () => Array.from(document.querySelectorAll(`script[src="${TEST_URL}"]`));

/** Setzt die private Router-URL, bevor ngOnInit ueber detectChanges laeuft. */
const mitTestUrl = (fixture: ComponentFixture<EthChatComponent>) => {
  (fixture.componentInstance as unknown as { routerScriptUrl: string }).routerScriptUrl = TEST_URL;
  return fixture;
};

describe('EthChatComponent', () => {
  let fixture: ComponentFixture<EthChatComponent>;
  let errorServiceMock: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(async () => {
    errorServiceMock = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    await TestBed.configureTestingModule({
      imports: [EthChatComponent],
      providers: [
        { provide: EthErrorHandlingService, useValue: errorServiceMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthChatComponent);
  });

  afterEach(() => {
    testScripts().forEach(script => script.remove());
  });

  it('should create', () => {
    mitTestUrl(fixture).detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('verwendet die konfigurierte Router-URL', () => {
    const url = (fixture.componentInstance as unknown as { routerScriptUrl: string }).routerScriptUrl;
    expect(url).toBe(PRODUKTIV_URL);
  });

  it('bindet das Router-Skript genau einmal in den body ein', () => {
    mitTestUrl(fixture).detectChanges();

    const scripts = testScripts();
    expect(scripts.length).toBe(1);
    expect(scripts[0].parentElement).toBe(document.body);
    expect((scripts[0] as HTMLScriptElement).async).toBeTrue();
  });

  it('bindet kein zweites Skript ein, wenn bereits eines vorhanden ist', () => {
    mitTestUrl(fixture).detectChanges();
    mitTestUrl(TestBed.createComponent(EthChatComponent)).detectChanges();

    expect(testScripts().length).toBe(1);
  });

  it('protokolliert einen Fehler, wenn das Skript nicht geladen werden kann', () => {
    mitTestUrl(fixture).detectChanges();

    const script = testScripts()[0] as HTMLScriptElement;
    script.onerror!(new Event('error'));

    expect(errorServiceMock.logError).toHaveBeenCalledWith(
      jasmine.any(String),
      'EthChatComponent.ngOnInit()'
    );
  });
});
