import { TestBed } from '@angular/core/testing';
import { SafeTranslatePipe } from './safe-translate.pipe';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';


describe('SafeTranslatePipe', () => {
  let pipe: SafeTranslatePipe;
  let translateSpy: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    translateSpy = jasmine.createSpyObj<TranslateService>('TranslateService', ['stream']);

    TestBed.configureTestingModule({
      providers: [
        SafeTranslatePipe,
        { provide: TranslateService, useValue: translateSpy }
      ]
    });

    pipe = TestBed.inject(SafeTranslatePipe);
  });

  it('returns translate.stream output', (done) => {
    translateSpy.stream.and.returnValue(of('translated'));

    pipe.transform('key').subscribe(value => {
      expect(value).toBe('translated');
      expect(translateSpy.stream).toHaveBeenCalledWith('key');
      done();
    });
  });
  
});
