import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { EthWaybackComponent } from './eth-wayback.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
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

  beforeEach(async () => {
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

  const buildViewItDom = (doc: Document) => {
    const container = doc.createElement('nde-full-display-container');
    const card = doc.createElement('nde-view-it-card');
    const button = doc.createElement('button');
    const header = doc.createElement('h5');
    button.appendChild(header);
    card.appendChild(button);
    container.appendChild(card);
    doc.body.appendChild(container);
    return { container, card, button, header };
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('initializes observer when a wayback link exists', () => {
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
    const { container, card, header } = buildViewItDom(documentRef);

    (component as any).changeDom();

    const hint = card.querySelector('#eth-wayback-hint');
    expect(header.textContent).toBe('Wayback');
    expect(hint?.textContent).toBe('Hint');

    documentRef.body.removeChild(container);
  });

  it('re-renders on language change', () => {
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
