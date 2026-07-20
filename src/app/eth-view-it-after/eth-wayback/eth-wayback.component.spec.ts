import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { EthWaybackComponent } from './eth-wayback.component';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

describe('EthWaybackComponent', () => {
  let component: EthWaybackComponent;
  let fixture: ComponentFixture<EthWaybackComponent>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let translateMock: jasmine.SpyObj<TranslateService>;
  let onLangChange$: Subject<any>;
  let documentRef: Document;
  let mutationCallbacks: MutationCallback[];
  let mockObservers: MockMutationObserver[];
  let originalMutationObserver: typeof MutationObserver;

  class MockMutationObserver {
    observe = jasmine.createSpy('observe');
    disconnect = jasmine.createSpy('disconnect');
    constructor(public callback: MutationCallback) {
      mutationCallbacks.push(callback);
      mockObservers.push(this);
    }
  }

  beforeEach(async () => {
    mutationCallbacks = [];
    mockObservers = [];
    originalMutationObserver = window.MutationObserver;
    (window as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver = MockMutationObserver as unknown as typeof MutationObserver;

    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getFullDisplayDeliveryEntity$'
    ]);
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['get', 'instant']);
    onLangChange$ = new Subject<any>();
    Object.defineProperty(translateMock, 'onLangChange', { value: onLangChange$ });

    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({ delivery: { link: [] } }));
    translateMock.get.and.returnValue(of({
      'eth.wayback.text': 'Hint',
      'eth.wayback.linkText': 'Wayback'
    }));
    translateMock.instant.and.callFake((key: string) => key === 'eth.wayback.text' ? 'Hint' : 'Wayback');

    await TestBed.configureTestingModule({
      imports: [EthWaybackComponent],
      providers: [
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthWaybackComponent);
    component = fixture.componentInstance;
    documentRef = TestBed.inject(DOCUMENT);
    fixture.detectChanges();
  });

  afterEach(() => {
    (window as unknown as { MutationObserver: typeof MutationObserver }).MutationObserver = originalMutationObserver;
    documentRef?.querySelectorAll('nde-full-display-container').forEach(node => node.parentNode?.removeChild(node));
  });

  const buildViewItDom = (doc: Document) => {
    const container = doc.createElement('nde-full-display-container');
    const card = doc.createElement('nde-view-it-card');
    const textContainer = doc.createElement('div');
    textContainer.className = 'view-it-text';
    const link = doc.createElement('a');
    const span = doc.createElement('span');
    link.appendChild(span);
    textContainer.appendChild(link);
    card.appendChild(textContainer);
    container.appendChild(card);
    doc.body.appendChild(container);
    return { container, card, textContainer, link, span };
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('When a wayback link exists: wait for viewIt content (MutationObserver)', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://wayback.archive-It.org/123' }] }
    }));

    const initObserverSpy = spyOn(component as any, 'initObserver');

    component.ngAfterViewInit();

    expect(initObserverSpy).toHaveBeenCalled();
  });


  it('skips observer when no wayback link exists', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://example.com/other' }] }
    }));

    const initObserverSpy = spyOn(component as any, 'initObserver');

    component.ngAfterViewInit();

    expect(initObserverSpy).not.toHaveBeenCalled();
  });


  it('updates button label and hint text', () => {
    const { container, card, span } = buildViewItDom(documentRef);

    (component as any).changeDom();

    const hint = card.querySelector('#eth-wayback-hint');
    expect(span.textContent).toBe('Wayback');
    expect(hint?.textContent).toBe('Hint');

    documentRef.body.removeChild(container);
  });


  it('returns early when required DOM nodes are missing', () => {
    const container = documentRef.createElement('nde-full-display-container');
    const card = documentRef.createElement('nde-view-it-card');
    container.appendChild(card);
    documentRef.body.appendChild(container);
    translateMock.get.calls.reset();

    (component as any).changeDom();

    expect(translateMock.get).not.toHaveBeenCalled();

    documentRef.body.removeChild(container);
  });


  it('skips redundant DOM updates when link and hint already match translations', () => {
    const { container, card, span } = buildViewItDom(documentRef);
    span.textContent = 'Wayback';
    const hint = documentRef.createElement('div');
    hint.id = 'eth-wayback-hint';
    hint.textContent = 'Hint';
    card.appendChild(hint);
    translateMock.get.calls.reset();

    (component as any).changeDom();

    expect(translateMock.get).not.toHaveBeenCalled();

    documentRef.body.removeChild(container);
  });


  it('re-renders on language change', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://wayback.archive-It.org/123' }] }
    }));
    const changeDomSpy = spyOn(component as any, 'changeDom');

    component.ngAfterViewInit();
    onLangChange$.next({ lang: 'en' });

    expect(changeDomSpy).toHaveBeenCalled();
  });


  it('does not render wayback hints on language change when no wayback link exists', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://example.com/other' }] }
    }));
    const { container, card } = buildViewItDom(documentRef);

    component.ngAfterViewInit();
    onLangChange$.next({ lang: 'de' });

    expect(card.querySelector('#eth-wayback-hint')).toBeNull();

    documentRef.body.removeChild(container);
  });

  
  it('logs errors when delivery stream fails', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(throwError(() => new Error('boom')));

    component.ngAfterViewInit();

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });


  it('detects wayback links', () => {
    expect((component as any).hasWaybackLink({ delivery: { link: [{ linkURL: 'https://wayback.archive-It.org/foo' }] } })).toBeTrue();
    expect((component as any).hasWaybackLink({ delivery: { link: [{ linkURL: 'https://example.com' }] } })).toBeFalse();
    expect((component as any).hasWaybackLink(null)).toBeFalse();
  });


  it('initializes mutation observer only once for repeated true emissions', () => {
    const delivery$ = new Subject<any>();
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(delivery$);

    const initObserverSpy = spyOn(component as any, 'initObserver').and.callThrough();

    component.ngAfterViewInit();
    delivery$.next({ delivery: { link: [{ linkURL: 'https://wayback.archive-It.org/1' }] } });
    delivery$.next({ delivery: { link: [{ linkURL: 'https://wayback.archive-It.org/2' }] } });

    expect(initObserverSpy).toHaveBeenCalledTimes(1);
  });


  it('observes DOM mutations and disconnects on destroy', () => {
    const { container } = buildViewItDom(documentRef);
    const changeDomSpy = spyOn(component as any, 'changeDom');

    (component as any).initObserver();

    expect(mockObservers.length).toBe(1);
    expect(mockObservers[0].observe).toHaveBeenCalledWith(container, { childList: true, subtree: true });
    expect(changeDomSpy).toHaveBeenCalledTimes(1);

    mutationCallbacks[0]?.([], mockObservers[0] as unknown as MutationObserver);
    expect(changeDomSpy).toHaveBeenCalledTimes(2);

    fixture.destroy();
    expect(mockObservers[0].disconnect).toHaveBeenCalled();

    documentRef.body.removeChild(container);
  });


  it('disconnects observer when wayback link disappears', () => {
    const delivery$ = new Subject<any>();
    const { container } = buildViewItDom(documentRef);
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(delivery$);

    component.ngAfterViewInit();
    delivery$.next({ delivery: { link: [{ linkURL: 'https://wayback.archive-It.org/1' }] } });

    expect(mockObservers.length).toBe(1);

    delivery$.next({ delivery: { link: [{ linkURL: 'https://example.com/other' }] } });

    expect(mockObservers[0].disconnect).toHaveBeenCalled();

    documentRef.body.removeChild(container);
  });
});
