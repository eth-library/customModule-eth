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


  it('should rewrite image URL if image url contains "library.ethz.ch"', async () => {
    const mockNews = {
      entries: [{ appjson: 'https://library.ethz.ch/foo.jpg' }]
    };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));
    fixture.detectChanges();

    const result = await firstValueFrom(component.news$);
    expect(result?.entries[0].image).toContain('aem-newsimage-redirector.replit.app');
  });


  it('set image URL to undefined, if image url does not contains "library.ethz.ch" ( -> image not rendered)', async () => {
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
      'EthBibNewsComponent.news$'
    );
    expect(result).toBeNull();
  });


  it('renders news entries and link "all news"', async () => {
    const mockNews = {
      entries: [
        {
          id: '1',
          title: 'News One',
          lead: 'Lead One',
          link: 'https://example.com/1',
          appjson: 'https://library.ethz.ch/foo.jpg',
          author: '',
          tags: [],
          updated: '',
          published: '',
          commentCount: 0
        },
        {
          id: '2',
          title: 'News Two',
          lead: 'Lead Two',
          link: 'https://example.com/2',
          appjson: 'https://example.com/bar.jpg',
          author: '',
          tags: [],
          updated: '',
          published: '',
          commentCount: 0
        }
      ]
    };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.nativeElement as HTMLElement;
    const items = container.querySelectorAll('.eth-news');
    expect(items.length).toBe(2);

    const firstTitleLink = items[0].querySelector('.eth-news-headline a') as HTMLAnchorElement;
    expect(firstTitleLink?.textContent).toContain('News One');
    expect(firstTitleLink?.getAttribute('href')).toBe('https://example.com/1');

    const footerLink = container.querySelector('.eth-news-footer a') as HTMLAnchorElement;
    expect(footerLink?.getAttribute('href')).toBe('https://library.ethz.ch/news-und-kurse/news-swisscovery.html');
  });


  it('renders an image only when the transformed url exists', async () => {
    const mockNews = {
      entries: [
        {
          id: '1',
          title: 'News One',
          lead: 'Lead One',
          link: 'https://example.com/1',
          appjson: 'https://library.ethz.ch/foo.jpg',
          author: '',
          tags: [],
          updated: '',
          published: '',
          commentCount: 0
        },
        {
          id: '2',
          title: 'News Two',
          lead: 'Lead Two',
          link: 'https://example.com/2',
          appjson: 'https://example.com/bar.jpg',
          author: '',
          tags: [],
          updated: '',
          published: '',
          commentCount: 0
        }
      ]
    };
    newsServiceSpy.getNews.and.returnValue(of(mockNews as any));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const container = fixture.nativeElement as HTMLElement;
    const images = container.querySelectorAll('.eth-news-image-link img');
    expect(images.length).toBe(1);

    const firstImage = images[0] as HTMLImageElement;
    expect(firstImage.getAttribute('src')).toContain('aem-newsimage-redirector.replit.app');
  });

});