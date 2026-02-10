import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthOffcampusWarningComponent } from './eth-offcampus-warning.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { firstValueFrom, of, throwError } from 'rxjs';

describe('EthOffcampusWarningComponent', () => {
  let component: EthOffcampusWarningComponent;
  let fixture: ComponentFixture<EthOffcampusWarningComponent>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(async () => {
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getFullDisplayRecord$',
      'getFullDisplayDeliveryEntity$'
    ]);
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });

    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    await TestBed.configureTestingModule({
      imports: [EthOffcampusWarningComponent],
      providers: [
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOffcampusWarningComponent);
    component = fixture.componentInstance;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  
  it('does not warn when on campus', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(true),
      writable: true
    });

    const result = await firstValueFrom(component.showWarning$);

    expect(result).toBeFalse();
    expect(storeSpy.getFullDisplayRecord$).not.toHaveBeenCalled();
  });


  it('does not warn for open access records', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });
    storeSpy.getFullDisplayRecord$.and.returnValue(
      of({ pnx: { addata: { openaccess: ['true'] } } })
    );

    const result = await firstValueFrom(component.showWarning$);

    expect(result).toBeFalse();
    expect(storeSpy.getFullDisplayDeliveryEntity$).not.toHaveBeenCalled();
  });


  it('warns for Alma-E delivery category', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });
    storeSpy.getFullDisplayRecord$.and.returnValue(
      of({ pnx: { addata: { openaccess: ['false'] } } })
    );
    storeSpy.getFullDisplayDeliveryEntity$.and.returnValue(
      of({
        delivery: {
          deliveryCategory: ['Alma-E'],
          electronicServices: [{ ilsApiId: 'alma_123', serviceUrl: 'https://example.test' }]
        }
      })
    );

    const result = await firstValueFrom(component.showWarning$);

    expect(result).toBeTrue();
  });


  it('does not warn for remote search resource from non-cdi source', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });
    storeSpy.getFullDisplayRecord$.and.returnValue(
      of({ pnx: { addata: { openaccess: ['false'] } } })
    );
    storeSpy.getFullDisplayDeliveryEntity$.and.returnValue(
      of({
        delivery: {
          deliveryCategory: ['Remote Search Resource'],
          electronicServices: [{ ilsApiId: 'alma_123', serviceUrl: 'https://example.test' }]
        }
      })
    );

    const result = await firstValueFrom(component.showWarning$);

    expect(result).toBeFalse();
  });


  it('does not warn when public note indicates web access', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });
    storeSpy.getFullDisplayRecord$.and.returnValue(
      of({ pnx: { addata: { openaccess: ['false'] } } })
    );
    storeSpy.getFullDisplayDeliveryEntity$.and.returnValue(
      of({
        delivery: {
          deliveryCategory: ['Alma-E'],
          electronicServices: [{
            ilsApiId: 'alma_123',
            serviceUrl: 'https://example.test',
            publicNote: 'Onlinezugriff via World Wide Web'
          }]
        }
      })
    );

    const result = await firstValueFrom(component.showWarning$);

    expect(result).toBeFalse();
  });


  it('does not warn for library stack records', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });
    storeSpy.getFullDisplayRecord$.and.returnValue(
      of({ pnx: { addata: { openaccess: ['false'] } } })
    );
    storeSpy.getFullDisplayDeliveryEntity$.and.returnValue(
      of({
        recordId: 'cdi_librarystack_123',
        delivery: {
          deliveryCategory: ['Alma-E'],
          electronicServices: [{ ilsApiId: 'alma_123', serviceUrl: 'https://example.test' }]
        }
      })
    );

    const result = await firstValueFrom(component.showWarning$);

    expect(result).toBeFalse();
  });
  

  it('logs and suppresses errors', async () => {
    Object.defineProperty(storeSpy, 'isOnCampus$', {
      value: of(false),
      writable: true
    });
    storeSpy.getFullDisplayRecord$.and.returnValue(throwError(() => new Error('boom')));

    const result = await firstValueFrom(component.showWarning$);

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
    expect(result).toBeFalse();
  });
});
