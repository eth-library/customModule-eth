import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthLocationLinkComponent } from './eth-location-link.component';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthUtilsService } from '../../services/eth-utils.service';
import { SafeHtml } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

describe('EthLocationLinkComponent', () => {
  let component: EthLocationLinkComponent;
  let fixture: ComponentFixture<EthLocationLinkComponent>;
  let translateMock: jasmine.SpyObj<TranslateService>;
  let errorHandlingMock: jasmine.SpyObj<EthErrorHandlingService>;
  let utilsMock: jasmine.SpyObj<EthUtilsService>;

  beforeEach(async () => {
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['stream', 'get']);
    errorHandlingMock = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError', 'logError']);
    utilsMock = jasmine.createSpyObj<EthUtilsService>('EthUtilsService', ['sanitizeHtml']);

    translateMock.get.and.returnValue(of('(opens in a new window)'));

    await TestBed.configureTestingModule({
      imports: [EthLocationLinkComponent],
      providers: [
        { provide: TranslateService, useValue: translateMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingMock },
        { provide: EthUtilsService, useValue: utilsMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthLocationLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('does nothing when no location is provided', () => {
    component.hostComponent = {};
    expect(translateMock.stream).not.toHaveBeenCalled();
  });


  it('show a sanitized link when translation exists for library / sublocation', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E01',
        subLocationCode: 'AETH',
        mainLocation: 'ETH Main'
      }
    };

    translateMock.stream.and.returnValue(of('raw-link'));
    utilsMock.sanitizeHtml.and.returnValue('safe-link');

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(component.hostComponent.expanded).toBeTrue();
    expect(emitted).toBe('safe-link');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E01.AETH');
    expect(translateMock.get).toHaveBeenCalledWith('nui.aria.newWindow');
  });


  it('extends aria-label for links opening in a new window', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E01',
        subLocationCode: 'AETH',
        mainLocation: 'ETH Main'
      }
    };

    translateMock.stream.and.returnValue(of('<a href="https://example.org" target="_blank">Library</a>'));
    translateMock.get.and.returnValue(of('(opens in a new window)'));
    utilsMock.sanitizeHtml.and.callFake(value => value as string);

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted as string).toContain('aria-label="Library (opens in a new window)"');
  });


  it('falls back to library translation when there is no sublocation translation in code tables', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E33',
        subLocationCode: 'E33XYZ',
        mainLocation: 'Chemie'
      }
    };

    translateMock.stream.and.callFake((key: string) => {
      if (key === 'eth.locationLink.E33.E33XYZ') {
        return of('eth.locationLink.E33.E33XYZ');
      }
      if (key === 'eth.locationLink.E33') {
        return of('E33-link');
      }
      return of(null);
    });
    utilsMock.sanitizeHtml.and.returnValue('E33-link');

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted).toBe('E33-link');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E33.E33XYZ');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E33');
  });


  it('falls back to slsp registry when there is no sublocation and no location translation in code tables', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E99',
        subLocationCode: 'E99XX',
        mainLocation: 'XYZ-Bibliothek'
      }
    };

    translateMock.stream.and.callFake((key: string, params?: Record<string, string>) => {
      if (key === 'eth.locationLink.E99.E99XX') {
        return of('eth.locationLink.E99.E99XX');
      }
      if (key === 'eth.locationLink.E99') {
        return of('eth.locationLink.E99');
      }
      if (key === 'eth.locationLink.default') {
        return of(`<a href="https://registration.slsp.ch/libraries?search=E99" target="_blank">XYZ-Bibliothek</a>`);
      }
      return of(null);
    });
    utilsMock.sanitizeHtml.and.callFake(value => value as string);

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted).toBe('<a href="https://registration.slsp.ch/libraries?search=E99" target="_blank" aria-label="XYZ-Bibliothek (opens in a new window)">XYZ-Bibliothek</a>');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.default', {
      code: 'E99',
      libraryName: 'XYZ-Bibliothek'
    });
  });


  it('logs translation errors and emits nothing', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E06',
        subLocationCode: 'E06LI',
        mainLocation: 'Literatur'
      }
    };

    translateMock.stream.and.returnValue(throwError(() => new Error('boom')));
    utilsMock.sanitizeHtml.and.callFake(value => value as string);

    component.link$.subscribe();

    expect(errorHandlingMock.logError).toHaveBeenCalled();
  });
});
