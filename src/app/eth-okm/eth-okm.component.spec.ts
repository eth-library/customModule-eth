import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthOKMComponent } from './eth-okm.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { firstValueFrom, of, throwError } from 'rxjs';

describe('EthOKMComponent', () => {
  let component: EthOKMComponent;
  let fixture: ComponentFixture<EthOKMComponent>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(async () => {
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', ['isFullview$'], {
      searchValue$: of('default')
    });
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);

    await TestBed.configureTestingModule({
      imports: [EthOKMComponent],
      providers: [
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOKMComponent);
    component = fixture.componentInstance;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('uses search value when not in full view', async () => {
    storeSpy.isFullview$.and.returnValue(of(false));
    Object.defineProperty(storeSpy, 'searchValue$', {
      value: of('query'),
      writable: true
    });

    const result = await firstValueFrom(component.searchValue$);

    expect(result).toBe('query');
  });


  it('returns null when in full view', async () => {
    storeSpy.isFullview$.and.returnValue(of(true));

    const result = await firstValueFrom(component.searchValue$);

    expect(result).toBeNull();
  });


  it('logs errors and returns null', async () => {
    storeSpy.isFullview$.and.returnValue(throwError(() => new Error('boom')));

    const result = await firstValueFrom(component.searchValue$);

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
    expect(result).toBeNull();
  });


  it('encodes search value safely', () => {
    expect(component.encode('hello world')).toBe('hello%20world');
    expect(component.encode(null)).toBe('');
  });
});
