import { TestBed } from '@angular/core/testing';
import { EthUtilsService } from './eth-utils.service';
import { EthErrorHandlingService } from './eth-error-handling.service';


describe('EthUtilsService', () => {
  let service: EthUtilsService;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  beforeEach(() => {
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', [
      'logError'
    ]);

    TestBed.configureTestingModule({
      providers: [
        EthUtilsService,
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    });

    service = TestBed.inject(EthUtilsService);
  });
  

  it('sanitizes disallowed tags', () => {
    const input = '<p>Ok</p><script>alert(1)</script><strong>Bold</strong>';
    const result = service.sanitizeHtml(input);
    expect(result).toBe('<p>Ok</p>alert(1)<strong>Bold</strong>');
  });


  it('returns null for empty input', () => {
    expect(service.sanitizeHtml(null)).toBeNull();
  });


  it('logs errors in sanitizeHtml()', () => {
    spyOn(document, 'createElement').and.throwError('boom');

    const result = service.sanitizeHtml('<p>x</p>');

    expect(result).toBeNull();
    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });

  /*
  it('returns a listener for positionCard', () => {
    const matchMediaSpy = spyOn(window, 'matchMedia').and.returnValue({
      matches: false,
      addEventListener: jasmine.createSpy('addEventListener')
    } as any);

    const listener = service.positionCard('.eth-place-cards');

    expect(matchMediaSpy).toHaveBeenCalledWith('(max-width: 599px)');
    expect(listener).toEqual(jasmine.any(Function));
  });
  */
});
