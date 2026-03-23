import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { EthLibraryStackComponent } from './eth-library-stack.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

describe('EthLibraryStackComponent', () => {
  let component: EthLibraryStackComponent;
  let fixture: ComponentFixture<EthLibraryStackComponent>;
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
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['get']);
    onLangChange$ = new Subject<any>();
    Object.defineProperty(translateMock, 'onLangChange', { value: onLangChange$ });

    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({ delivery: { link: [] } }));

    await TestBed.configureTestingModule({
      imports: [EthLibraryStackComponent],
      providers: [
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLibraryStackComponent);
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
    const button = doc.createElement('button');
    card.appendChild(button);
    container.appendChild(card);
    doc.body.appendChild(container);
    return { container, card, button };
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  
  it('When a library stack link exists: wait for viewIt content (MutationObserver)', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://www.librarystack.org/item' }] } 
    }));

    const initObserverSpy = spyOn(component as any, 'initObserver');

    component.ngAfterViewInit();

    expect(initObserverSpy).toHaveBeenCalled();
  });


  it('skips observer when no library stack link exists', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://example.com/other' }] }
    }));

    const initObserverSpy = spyOn(component as any, 'initObserver');

    component.ngAfterViewInit();

    expect(initObserverSpy).not.toHaveBeenCalled();
  });


  it('renders hint text once', () => {
    const { container, card } = buildViewItDom(documentRef);
    translateMock.get.and.returnValue(of({
      'eth.libraryStack.text1': 'Text 1',
      'eth.libraryStack.text2': 'Text 2'
    }));

    (component as any).changeDom();
    (component as any).changeDom();

    const text1 = card.querySelectorAll('.eth-librarystack-text1');
    const text2 = card.querySelectorAll('.eth-librarystack-text2');
    expect(text1.length).toBe(1);
    expect(text2.length).toBe(1);

    documentRef.body.removeChild(container);
  });
  

  it('updates rendered hint text on language change', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://www.librarystack.org/item' }] }
    }));
    const { container, card } = buildViewItDom(documentRef);

    let callCount = 0;
    translateMock.get.and.callFake(() => {
      callCount += 1;
      if (callCount === 1) {
        return of({
          'eth.libraryStack.text1': 'Text 1',
          'eth.libraryStack.text2': 'Text 2'
        });
      }
      return of({
        'eth.libraryStack.text1': 'Text 1 DE',
        'eth.libraryStack.text2': 'Text 2 DE'
      });
    });

    component.ngAfterViewInit();
    expect(card.querySelector('.eth-librarystack-text1')?.textContent).toBe('Text 1');

    onLangChange$.next({ lang: 'en' });
    expect(card.querySelector('.eth-librarystack-text1')?.textContent).toBe('Text 1 DE');

    documentRef.body.removeChild(container);
  });


  it('does not render hints on language change when no library stack link exists', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://example.com/other' }] }
    }));
    const { container, card } = buildViewItDom(documentRef);

    translateMock.get.and.returnValue(of({
      'eth.libraryStack.text1': 'Text 1',
      'eth.libraryStack.text2': 'Text 2'
    }));

    component.ngAfterViewInit();
    onLangChange$.next({ lang: 'de' });

    expect(card.querySelector('.eth-librarystack-text1')).toBeNull();
    expect(card.querySelector('.eth-librarystack-text2')).toBeNull();

    documentRef.body.removeChild(container);
  });


  it('initializes mutation observer only once for repeated true emissions', () => {
    const delivery$ = new Subject<any>();
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(delivery$);

    const initObserverSpy = spyOn(component as any, 'initObserver').and.callThrough();

    component.ngAfterViewInit();
    delivery$.next({ delivery: { link: [{ linkURL: 'https://www.librarystack.org/a' }] } });
    delivery$.next({ delivery: { link: [{ linkURL: 'https://www.librarystack.org/b' }] } });

    expect(initObserverSpy).toHaveBeenCalledTimes(1);
  });


  it('disconnects mutation observer on destroy', () => {
    const { container } = buildViewItDom(documentRef);
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://www.librarystack.org/item' }] }
    }));
    translateMock.get.and.returnValue(of({
      'eth.libraryStack.text1': 'Text 1',
      'eth.libraryStack.text2': 'Text 2'
    }));

    component.ngAfterViewInit();

    expect(mockObservers.length).toBe(1);
    expect(mockObservers[0].observe).toHaveBeenCalled();

    fixture.destroy();
    expect(mockObservers[0].disconnect).toHaveBeenCalled();

    documentRef.body.removeChild(container);
  });


  it('disconnects observer when library stack link disappears', () => {
    const delivery$ = new Subject<any>();
    const { container } = buildViewItDom(documentRef);
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(delivery$);
    translateMock.get.and.returnValue(of({
      'eth.libraryStack.text1': 'Text 1',
      'eth.libraryStack.text2': 'Text 2'
    }));

    component.ngAfterViewInit();
    delivery$.next({ delivery: { link: [{ linkURL: 'https://www.librarystack.org/item' }] } });

    expect(mockObservers.length).toBe(1);

    delivery$.next({ delivery: { link: [{ linkURL: 'https://example.com/other' }] } });

    expect(mockObservers[0].disconnect).toHaveBeenCalled();

    documentRef.body.removeChild(container);
  });


  it('logs errors when delivery stream fails', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(throwError(() => new Error('boom')));

    component.ngAfterViewInit();

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });

});
