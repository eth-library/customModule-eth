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

  beforeEach(async () => {
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

  it('initializes observer when a library stack link exists', () => {
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

  it('re-renders on language change', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(of({
      delivery: { link: [{ linkURL: 'https://www.librarystack.org/item' }] }
    }));
    translateMock.get.and.returnValue(of({
      'eth.libraryStack.text1': 'Text 1',
      'eth.libraryStack.text2': 'Text 2'
    }));

    const changeDomSpy = spyOn(component as any, 'changeDom');

    component.ngAfterViewInit();
    onLangChange$.next({ lang: 'en' });

    expect(changeDomSpy).toHaveBeenCalled();
  });

  it('logs errors when delivery stream fails', () => {
    storeService.getFullDisplayDeliveryEntity$.and.returnValue(throwError(() => new Error('boom')));

    component.ngAfterViewInit();

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
