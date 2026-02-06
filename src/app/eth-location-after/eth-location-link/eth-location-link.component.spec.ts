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
    component.ngOnInit();

    expect(translateMock.stream).not.toHaveBeenCalled();
  });


  it('emits sanitized link and expands host when translation exists', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E01',
        subLocationCode: 'AETH',
        mainLocation: 'Main'
      }
    };

    translateMock.stream.and.returnValue(of('raw-link'));
    utilsMock.sanitizeText.and.returnValue('safe-link');

    component.ngOnInit();

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(component.hostComponent.expanded).toBeTrue();
    expect(emitted).toBe('safe-link');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E01.AETH');
  });


  it('falls back to library link when sublocation is missing', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E33',
        subLocationCode: 'UNKNOWN',
        mainLocation: 'Chemie'
      }
    };

    translateMock.stream.and.callFake((key: string) => {
      if (key === 'eth.locationLink.E33.UNKNOWN') {
        return of('eth.locationLink.E33.UNKNOWN');
      }
      if (key === 'eth.locationLink.E33') {
        return of('library-link');
      }
      return of(null);
    });
    utilsMock.sanitizeText.and.returnValue('library-link');

    component.ngOnInit();

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted).toBe('library-link');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E33.UNKNOWN');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.E33');
  });


  it('falls back to default link when no specific translations exist', () => {
    component.hostComponent = {
      location: {
        libraryCode: 'E99',
        subLocationCode: 'E99XX',
        mainLocation: 'Default Name'
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

    component.ngOnInit();

    let emitted: SafeHtml | null | undefined;
    component.link$.subscribe(value => (emitted = value));

    expect(emitted).toBe('default-E99-Default Name');
    expect(translateMock.stream).toHaveBeenCalledWith('eth.locationLink.default', {
      code: 'E99',
      libraryName: 'Default Name'
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

    component.ngOnInit();
    component.link$.subscribe();

    expect(errorHandlingMock.logError).toHaveBeenCalled();
  });
});
