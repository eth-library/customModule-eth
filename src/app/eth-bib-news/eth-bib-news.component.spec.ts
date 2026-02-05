import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthBibNewsComponent } from './eth-bib-news.component';
import { EthBibNewsService } from './eth-bib-news.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, Subject, take, throwError } from 'rxjs';


describe('EthBibNewsComponent', () => {
  let component: EthBibNewsComponent;
  let fixture: ComponentFixture<EthBibNewsComponent>;

  let newsServiceSpy: jasmine.SpyObj<EthBibNewsService>;

  const langChange$ = new Subject<any>();

  const translateMock = {
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
        { provide: TranslateService, useValue: translateMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthBibNewsComponent);
    component = fixture.componentInstance;
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should load news on init with current language', () => {
    newsServiceSpy.getNews.and.returnValue(of({ entries: [] } as any));

    fixture.detectChanges();

    expect(newsServiceSpy.getNews).toHaveBeenCalledWith('de');
  });
  
  it('should reload news on language change', () => {
    newsServiceSpy.getNews.and.returnValue(of({ entries: [] } as any));
    fixture.detectChanges();

    langChange$.next({ lang: 'en' });

    expect(newsServiceSpy.getNews).toHaveBeenCalledWith('en');
  });


  it('should rewrite image URL if appjson contains library.ethz.ch', async () => {
    newsServiceSpy.getNews.and.returnValue(of({
      entries: [
        { appjson: 'https://library.ethz.ch/foo.jpg' }
      ]
    } as any));

    fixture.detectChanges();

    const result = await firstValueFrom(component.news$);
    expect(result?.entries[0].image).toContain('aem-newsimage-redirector.replit.app');

  });
  
});
