import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { EthRequestHintsComponent } from './eth-request-hints.component';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { EthUtilsService } from '../services/eth-utils.service';

const ETH_LINK = '/AlmaRequest?institution=41SLSP_ETH&hasHold=true';
const OTHER_LINK = '/AlmaRequest?institution=41SLSP_OTHER';

function ethHostComponent(formType: string) {
  return { formType, data: { request: { 'link-to-service': ETH_LINK } } };
}

describe('EthRequestHintsComponent', () => {
  let component: EthRequestHintsComponent;
  let fixture: ComponentFixture<EthRequestHintsComponent>;
  let ethErrorHandlingServiceMock: { logError: jasmine.Spy };
  let ethUtilsServiceMock: { sanitizeText: (text: string | null) => string | null };

  beforeEach(async () => {
    ethErrorHandlingServiceMock = { logError: jasmine.createSpy('logError') };
    ethUtilsServiceMock = { sanitizeText: (text) => text };

    await TestBed.configureTestingModule({
      imports: [EthRequestHintsComponent],
      providers: [
        { provide: EthStoreService, useValue: { userGroup$: of('ETH_Member') } },
        { provide: TranslateService, useValue: { stream: (key: string) => of(key) } },
        { provide: EthErrorHandlingService, useValue: ethErrorHandlingServiceMock },
        { provide: EthUtilsService, useValue: ethUtilsServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EthRequestHintsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── state$ ──────────────────────────────────────────────────────────────────

  describe('state$', () => {
    it('should emit null formType and false pickupAtETH for empty hostComponent', () => {
      component.hostComponent = {};
      let result: { formType: string | null; pickupAtETH: boolean } | undefined;
      component.state$.subscribe(v => (result = v));
      expect(result).toEqual({ formType: null, pickupAtETH: false });
    });

    it('should emit correct formType', () => {
      component.hostComponent = { formType: 'AlmaRequest' };
      let result: { formType: string | null; pickupAtETH: boolean } | undefined;
      component.state$.subscribe(v => (result = v));
      expect(result?.formType).toBe('AlmaRequest');
    });

    it('should emit pickupAtETH=true when link contains institution=41SLSP_ETH', () => {
      component.hostComponent = { data: { request: { 'link-to-service': ETH_LINK } } };
      let result: { formType: string | null; pickupAtETH: boolean } | undefined;
      component.state$.subscribe(v => (result = v));
      expect(result?.pickupAtETH).toBeTrue();
    });

    it('should emit pickupAtETH=false when institution differs', () => {
      component.hostComponent = { data: { request: { 'link-to-service': OTHER_LINK } } };
      let result: { formType: string | null; pickupAtETH: boolean } | undefined;
      component.state$.subscribe(v => (result = v));
      expect(result?.pickupAtETH).toBeFalse();
    });

    it('should emit pickupAtETH=false when link-to-service is undefined', () => {
      component.hostComponent = { data: { request: {} } };
      let result: { formType: string | null; pickupAtETH: boolean } | undefined;
      component.state$.subscribe(v => (result = v));
      expect(result?.pickupAtETH).toBeFalse();
    });

    it('should emit exactly once per hostComponent change (no double emission)', () => {
      const emissions: unknown[] = [];
      component.state$.subscribe(v => emissions.push(v));
      const before = emissions.length;
      component.hostComponent = ethHostComponent('AlmaRequest');
      expect(emissions.length - before).toBe(1);
    });

    it('should update when hostComponent changes', () => {
      const results: { formType: string | null; pickupAtETH: boolean }[] = [];
      component.state$.subscribe(v => results.push(v));
      component.hostComponent = ethHostComponent('AlmaDigitization');
      expect(results.at(-1)).toEqual({ formType: 'AlmaDigitization', pickupAtETH: true });
    });
  });

  // ─── hint$ ───────────────────────────────────────────────────────────────────

  describe('hint$', () => {
    // pickupAtETH = true (ETH institution in link)
    const ethCases: { formType: string; expected: string }[] = [
      { formType: 'AlmaRequest',           expected: 'eth.requestHint.request' },
      { formType: 'AlmaItemRequest',       expected: 'eth.requestHint.request' },
      { formType: 'AlmaRequestOther',      expected: 'eth.requestHint.request' },
      { formType: 'AlmaDigitization',      expected: 'eth.requestHint.digitization' },
      { formType: 'AlmaItemDigitization',  expected: 'eth.requestHint.digitization' },
      { formType: 'AlmaDigitizationOther', expected: 'eth.requestHint.digitization' },
    ];

    // pickupAtETH = false (no/other institution in link)
    const otherCases: { formType: string; expected: string }[] = [
      { formType: 'AlmaRequest',           expected: 'eth.requestHint.requestOtherLibrary' },
      { formType: 'AlmaItemRequest',       expected: 'eth.requestHint.requestOtherLibrary' },
      { formType: 'AlmaRequestOther',      expected: 'eth.requestHint.requestOtherLibrary' },
      { formType: 'AlmaDigitization',      expected: 'eth.requestHint.digitizationOtherLibrary' },
      { formType: 'AlmaItemDigitization',  expected: 'eth.requestHint.digitizationOtherLibrary' },
      { formType: 'AlmaDigitizationOther', expected: 'eth.requestHint.digitizationOtherLibrary' },
    ];

    describe('pickupAtETH = true', () => {
      ethCases.forEach(({ formType, expected }) => {
        it(`should emit "${expected}" for formType "${formType}"`, () => {
          component.hostComponent = ethHostComponent(formType);
          let result: string | null | undefined;
          component.hint$.subscribe(v => (result = v));
          expect(result).toBe(expected);
        });
      });
    });

    describe('pickupAtETH = false', () => {
      otherCases.forEach(({ formType, expected }) => {
        it(`should emit "${expected}" for formType "${formType}"`, () => {
          component.hostComponent = { formType };
          let result: string | null | undefined;
          component.hint$.subscribe(v => (result = v));
          expect(result).toBe(expected);
        });
      });
    });

    it('should emit null for unknown formType', () => {
      component.hostComponent = { formType: 'UnknownType' };
      let result: string | null | undefined;
      component.hint$.subscribe(v => (result = v));
      expect(result).toBeNull();
    });

    it('should emit null when hostComponent has no formType', () => {
      component.hostComponent = {};
      let result: string | null | undefined;
      component.hint$.subscribe(v => (result = v));
      expect(result).toBeNull();
    });

    it('should pass hint through sanitizeText', () => {
      const spy = spyOn(ethUtilsServiceMock, 'sanitizeText').and.callFake(t => `sanitized:${t}`);
      component.hostComponent = ethHostComponent('AlmaRequest');
      let result: string | null | undefined;
      component.hint$.subscribe(v => (result = v));
      expect(spy).toHaveBeenCalledWith('eth.requestHint.request');
      expect(result).toBe('sanitized:eth.requestHint.request');
    });
  });

  // ─── error handling ───────────────────────────────────────────────────────────

  describe('error handling', () => {
    it('should emit null and log error when sanitizeText throws', () => {
      spyOn(ethUtilsServiceMock, 'sanitizeText').and.throwError('sanitize error');
      component.hostComponent = ethHostComponent('AlmaRequest');
      let result: string | null | undefined;
      component.hint$.subscribe(v => (result = v));
      expect(result).toBeNull();
      expect(ethErrorHandlingServiceMock.logError).toHaveBeenCalled();
    });

    it('should keep stream alive after error and emit subsequent values', () => {
      const sanitizeSpy = spyOn(ethUtilsServiceMock, 'sanitizeText').and.throwError('error');
      const results: (string | null)[] = [];
      component.hint$.subscribe(v => results.push(v));

      component.hostComponent = ethHostComponent('AlmaRequest');
      expect(results.at(-1)).toBeNull();

      // Restore sanitize and verify stream continues
      sanitizeSpy.and.callFake((t: string | null) => t);
      component.hostComponent = ethHostComponent('AlmaDigitization');
      expect(results.at(-1)).toBe('eth.requestHint.digitization');
    });
  });

  // ─── rendering ───────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('should not render paragraph when hint is null', () => {
      component.hostComponent = {};
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('p.eth-request-hint-container')).toBeNull();
    });

    it('should render paragraph with ETH request hint', () => {
      component.hostComponent = ethHostComponent('AlmaRequest');
      fixture.detectChanges();
      const p = (fixture.nativeElement as HTMLElement).querySelector('p.eth-request-hint-container');
      expect(p).not.toBeNull();
      expect(p?.innerHTML).toBe('eth.requestHint.request');
    });

    it('should render paragraph with other-library request hint', () => {
      component.hostComponent = { formType: 'AlmaRequest' };
      fixture.detectChanges();
      const p = (fixture.nativeElement as HTMLElement).querySelector('p.eth-request-hint-container');
      expect(p).not.toBeNull();
      expect(p?.innerHTML).toBe('eth.requestHint.requestOtherLibrary');
    });

    it('should render paragraph with ETH digitization hint', () => {
      component.hostComponent = ethHostComponent('AlmaDigitization');
      fixture.detectChanges();
      const p = (fixture.nativeElement as HTMLElement).querySelector('p.eth-request-hint-container');
      expect(p?.innerHTML).toBe('eth.requestHint.digitization');
    });

    it('should update rendered hint when formType changes', () => {
      component.hostComponent = ethHostComponent('AlmaRequest');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('p.eth-request-hint-container')?.innerHTML).toBe('eth.requestHint.request');

      component.hostComponent = ethHostComponent('AlmaDigitization');
      fixture.detectChanges();
      expect(el.querySelector('p.eth-request-hint-container')?.innerHTML).toBe('eth.requestHint.digitization');
    });

    it('should update rendered hint when pickupAtETH changes', () => {
      component.hostComponent = ethHostComponent('AlmaRequest');
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('p.eth-request-hint-container')?.innerHTML).toBe('eth.requestHint.request');

      component.hostComponent = { formType: 'AlmaRequest' };
      fixture.detectChanges();
      expect(el.querySelector('p.eth-request-hint-container')?.innerHTML).toBe('eth.requestHint.requestOtherLibrary');
    });

    it('should remove paragraph when formType changes to unknown', () => {
      component.hostComponent = ethHostComponent('AlmaRequest');
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector('p.eth-request-hint-container')).not.toBeNull();

      component.hostComponent = { formType: 'Unknown' };
      fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).querySelector('p.eth-request-hint-container')).toBeNull();
    });
  });
});
