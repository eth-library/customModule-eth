import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { EthLocationHintComponent } from './eth-location-hint.component';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthUtilsService } from '../../services/eth-utils.service';
import { Renderer2, ElementRef } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

describe('EthLocationHintComponent', () => {
  let component: EthLocationHintComponent;
  let fixture: ComponentFixture<EthLocationHintComponent>;
  let translateMock: jasmine.SpyObj<TranslateService>;
  let errorHandlingMock: jasmine.SpyObj<EthErrorHandlingService>;
  let utilsMock: jasmine.SpyObj<EthUtilsService>;
  let rendererMock: jasmine.SpyObj<Renderer2>;

  beforeEach(async () => {
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['stream']);
    errorHandlingMock = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
    utilsMock = jasmine.createSpyObj<EthUtilsService>('EthUtilsService', ['sanitizeText']);
    rendererMock = jasmine.createSpyObj<Renderer2>('Renderer2', ['appendChild']);

    await TestBed.configureTestingModule({
      imports: [EthLocationHintComponent],
      providers: [
        { provide: TranslateService, useValue: translateMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingMock },
        { provide: EthUtilsService, useValue: utilsMock },
        { provide: Renderer2, useValue: rendererMock }
      ]
    }).compileComponents();
    
    fixture = TestBed.createComponent(EthLocationHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('does nothing when no location is provided', () => {
    component.hostComponent = {};
    component.ngAfterViewInit();

    expect(component.hint$).toBeUndefined();
    expect(translateMock.stream).not.toHaveBeenCalled();
  });


  it('show a sanitized hint when translation exists', fakeAsync(() => {
    component.hostComponent = {
      location: {
        libraryCode: 'E01',
        subLocationCode: 'AETH',
        ilsApiId: '123'
      }
    };

    translateMock.stream.and.returnValue(of('raw-hint'));
    utilsMock.sanitizeText.and.returnValue('safe-hint');

    component.ngAfterViewInit();

    let emitted: SafeHtml | null | undefined;
    component.hint$.subscribe(value => (emitted = value));
    tick(101);

    expect(emitted).toBe('safe-hint');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationHint.E01.AETH', { id: '123' });
  }));


  it('falls back to library translation when there is no sublocation translation in code tables', fakeAsync(() => {
    component.hostComponent = {
      location: {
        libraryCode: 'E33',
        subLocationCode: 'BLA',
        ilsApiId: '456'
      }
    };

    translateMock.stream.and.callFake((key: string) => {
      if (key === 'eth.locationHint.E33.BLA') {
        return of('eth.locationHint.E33.BLA');
      }
      if (key === 'eth.locationHint.E33') {
        return of('hint-for-E33');
      }
      return of(null);
    });
    utilsMock.sanitizeText.and.returnValue('fallback-hint');

    component.ngAfterViewInit();

    let emitted: SafeHtml | null | undefined;
    component.hint$.subscribe(value => (emitted = value));
    tick();
    tick(101);

    expect(emitted).toBe('fallback-hint');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationHint.E33.BLA', { id: '456' });
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationHint.E33', { id: '456' });
  }));


  it('moves the hint element into the holding info container', fakeAsync(() => {
    const hintEl = document.createElement('div');
    const wrapper = document.createElement('div');
    const holding = document.createElement('div');
    holding.className = 'getit-holding-info';
    const ndeLocation = document.createElement('nde-location');
    ndeLocation.appendChild(holding);
    ndeLocation.appendChild(wrapper);
    wrapper.appendChild(hintEl);
    document.body.appendChild(ndeLocation);

    component.locationHint = new ElementRef(hintEl);
    (component as any).renderer = rendererMock;

    (component as any).moveHint();
    tick(101);

    expect(rendererMock.appendChild).toHaveBeenCalledWith(holding, hintEl);

    document.body.removeChild(ndeLocation);
  }));

  
  it('logs translation errors and returns null', fakeAsync(() => {
    component.hostComponent = {
      location: {
        libraryCode: 'E06',
        subLocationCode: 'E06LI',
        ilsApiId: '789'
      }
    };

    translateMock.stream.and.returnValue(throwError(() => new Error('boom')));
    utilsMock.sanitizeText.and.callFake(value => (value ? value : null));

    component.ngAfterViewInit();
    component.hint$.subscribe();
    tick();

    expect(errorHandlingMock.logError).toHaveBeenCalled();
  }));
});
