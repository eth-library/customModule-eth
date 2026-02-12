import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { EthGitHintService } from './eth-git-hint.service'
import { EthUtilsService } from '../services/eth-utils.service';
import { EthGitHintComponent } from './eth-git-hint.component';
import { GitHintVM } from '../models/eth.model';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';

describe('EthGitHintComponent', () => {
  let component: EthGitHintComponent;
  let fixture: ComponentFixture<EthGitHintComponent>;
  let gitHintServiceSpy: jasmine.SpyObj<EthGitHintService>;
  let utilsServiceSpy: jasmine.SpyObj<EthUtilsService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  const langChange$ = new Subject<any>();

  const translateMock = {
    currentLang: 'de',
    onLangChange: langChange$.asObservable(),
    stream: (key: string) => of(key)
  };  


  beforeEach(async () => {
    gitHintServiceSpy = jasmine.createSpyObj('EthGitHintService', ['getHint']);
    utilsServiceSpy = jasmine.createSpyObj('EthUtilsService', ['sanitizeText']);
    utilsServiceSpy.sanitizeText.and.callFake((x: any) => x);
    errorHandlingSpy = jasmine.createSpyObj('EthErrorHandlingService', ['logError']);

    await TestBed.configureTestingModule({
      imports: [EthGitHintComponent],
      providers: [
        { provide: EthGitHintService, useValue: gitHintServiceSpy },
        { provide: EthUtilsService, useValue: utilsServiceSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthGitHintComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  
  it('should provide a german hint', async () => {
    translateMock.currentLang = 'de';
    await fixture.whenStable(); 

    gitHintServiceSpy.getHint.and.returnValue(
      of('deutscher Hinweis' as GitHintVM)
    );

    //fixture.detectChanges();

    expect(component.hint$).toBeDefined();

    const result = await firstValueFrom(component.hint$);
    expect(gitHintServiceSpy.getHint).toHaveBeenCalledWith('de');
    expect(result).toBe('deutscher Hinweis');
  });


  it('language en: should provide an english hint', async () => {
    translateMock.currentLang = 'en';
    await fixture.whenStable(); 

    gitHintServiceSpy.getHint.and.returnValue(of('english hint' as GitHintVM));

    //fixture.detectChanges();

    const result = await firstValueFrom(component.hint$);
    expect(gitHintServiceSpy.getHint).toHaveBeenCalledWith('en');
    expect(result).toBe('english hint');
  });


  it('should render german hint', async () => {
    gitHintServiceSpy.getHint.and.returnValue(
      of('deutscher Hinweis' as GitHintVM)
    );

    fixture.detectChanges();

    expect(component.hint$).toBeDefined();

    const compiled = fixture.nativeElement as HTMLElement;
    const headings = compiled.querySelectorAll('h1');
    const textH1 = Array.from(headings).map(el => el.textContent);
    expect(textH1).toContain('eth.gitHint.heading');
    const hint = compiled.querySelector('div[role="alert"]');
    expect(hint?.textContent).toContain('deutscher Hinweis');
  });


  it('falls back to german when currentLang is missing', async () => {
    translateMock.currentLang = undefined as any;
    gitHintServiceSpy.getHint.and.returnValue(of('deutscher Hinweis' as GitHintVM));

    //fixture.detectChanges();

    const result = await firstValueFrom(component.hint$);

    expect(gitHintServiceSpy.getHint).toHaveBeenCalledWith('de');
    expect(result).toBe('deutscher Hinweis');
  });


  it('sanitizes hint text', async () => {
    gitHintServiceSpy.getHint.and.returnValue(of('raw-hint' as GitHintVM));
    utilsServiceSpy.sanitizeText.and.returnValue('safe-hint');

    //fixture.detectChanges();

    const result = await firstValueFrom(component.hint$);

    expect(utilsServiceSpy.sanitizeText).toHaveBeenCalledWith('raw-hint');
    expect(result).toBe('safe-hint');
  });


  it('logs errors and emits null on failure', async () => {
    gitHintServiceSpy.getHint.and.returnValue(throwError(() => new Error('boom')));

    fixture.detectChanges();

    const result = await firstValueFrom(component.hint$);

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
    expect(result).toBeNull();
  });

});
