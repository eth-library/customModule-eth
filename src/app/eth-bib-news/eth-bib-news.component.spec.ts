import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthBibNewsComponent } from './eth-bib-news.component';
import { EthBibNewsService } from './eth-bib-news.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, throwError } from 'rxjs';

describe('EthBibNewsComponent', () => {
  let component: EthBibNewsComponent;
  let fixture: ComponentFixture<EthBibNewsComponent>;
  let newsServiceSpy: jasmine.SpyObj<EthBibNewsService>;

  const langChange$ = new Subject<any>();

  const translateServiceMock = {
    currentLang: 'de',
    onLangChange: langChange$.asObservable(),
    stream: (key: string) => of(key)
  };

  beforeEach(async () => {
    newsServiceSpy = jasmine.createSpyObj('EthBibNewsService', ['getNews']);

    await TestBed.configureTestingModule({
      imports: [EthBibNewsComponent], 
      providers: [
        { provide: EthBibNewsService, useValue: newsServiceSpy },
        { provide: TranslateService, useValue: translateServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthBibNewsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load news on init with current language', () => {
    const mockNews = { entries: [] };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));
    fixture.detectChanges();
    expect(newsServiceSpy.getNews).toHaveBeenCalledWith('de');
  });
  
  it('should reload news on language change', () => {
    const mockNews = { entries: [] };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));
    fixture.detectChanges();
    langChange$.next({ lang: 'en' });
    expect(newsServiceSpy.getNews).toHaveBeenCalledWith('en');
  });

  it('should rewrite image URL if appjson contains library.ethz.ch', async () => {
    const mockNews = {
      entries: [{ appjson: 'https://library.ethz.ch/foo.jpg' }]
    };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));
    fixture.detectChanges();

    const result = await firstValueFrom(component.news$);
    expect(result?.entries[0].image).toContain('aem-newsimage-redirector.replit.app');
  });

  it('should not rewrite image URL if appjson does not contain library.ethz.ch', async () => {
    const mockNews = {
      entries: [{ appjson: 'https://example.com/foo.jpg' }]
    };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));
    fixture.detectChanges();

    const result = await firstValueFrom(component.news$);
    expect(result?.entries[0].image).toBeUndefined();
  });

  it('should handle null feed gracefully', async () => {
    newsServiceSpy.getNews.and.returnValue(of(null as any));
    fixture.detectChanges();

    const result = await firstValueFrom(component.news$);
    expect(result).toBeNull();
  });

  it('should handle errors and log them', async () => {
    const testError = new Error('News fetch failed');
    newsServiceSpy.getNews.and.returnValue(throwError(() => testError));
    spyOn(component['ethErrorHandlingService'], 'logError');

    fixture.detectChanges();

    const result = await firstValueFrom(component.news$);
    expect(component['ethErrorHandlingService'].logError).toHaveBeenCalledWith(
      testError,
      'EthBibNewsComponent.ngOnInit()'
    );
    expect(result).toBeNull();
  });
});