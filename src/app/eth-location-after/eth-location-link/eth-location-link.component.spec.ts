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
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['stream']);
    errorHandlingMock = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
    utilsMock = jasmine.createSpyObj<EthUtilsService>('EthUtilsService', ['sanitizeText']);

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


  it('show a sanitized link when translation exists and expands location container', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E01',
        subLocationCode: 'AETH',
        mainLocation: 'ETH Main'
      }
    };

    translateMock.stream.and.returnValue(of('raw-link'));
    utilsMock.sanitizeText.and.returnValue('safe-link');

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(component.hostComponent.expanded).toBeTrue();
    expect(emitted).toBe('safe-link');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E01.AETH');
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
    utilsMock.sanitizeText.and.returnValue('E33-link');

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted).toBe('E33-link');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E33.E33XYZ');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E33');
  });


  it('falls back to default when there is no sublocation and location translation in code tables', () => {
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
        return of(`default-${params?.['code']}-${params?.['libraryName']}`);
      }
      return of(null);
    });
    utilsMock.sanitizeText.and.callFake(value => value as string);

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted).toBe('default-E99-XYZ-Bibliothek');
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
    utilsMock.sanitizeText.and.callFake(value => value as string);

    component.link$.subscribe();

    expect(errorHandlingMock.logError).toHaveBeenCalled();
  });
});
