import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthChangeAddressComponent } from './eth-change-address.component';
import { TranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';

// Mock TranslateService
const langChange$ = new Subject<any>();

const translateServiceMock = {
  currentLang: 'de',
  onLangChange: langChange$.asObservable(),
  get: (key: string) => of(key),
  stream: (key: string) => of(key),
  instant: (key: string) => key,
  onTranslationChange: of({ lang: 'de', translations: {} }),
  onDefaultLangChange: of({ lang: 'de' })     
};

describe('EthChangeAddressComponent', () => {
  let component: EthChangeAddressComponent;
  let fixture: ComponentFixture<EthChangeAddressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthChangeAddressComponent],      
      providers: [
        { provide: TranslateService, useValue: translateServiceMock } 
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthChangeAddressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create the component', () => {
    expect(component).toBeTruthy();
  });


  it('should render the main heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h3');
    expect(heading?.textContent).toContain('eth.changeAddress.heading');
  });


  it('should render the ethMembers section headings', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subHeadings = compiled.querySelectorAll('h4');
    const texts = Array.from(subHeadings).map(el => el.textContent);
    expect(texts).toContain('eth.changeAddress.ethMembers');
    expect(texts).toContain('eth.changeAddress.otherCustomers');
  });


  it('should render the ethMembersStep1 link correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="eth.changeAddress.ethMembersStep1Url"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('eth.changeAddress.ethMembersStep1Url');
  });


  it('should render the ethMembersStep2 link correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="eth.changeAddress.ethMembersStep2Url"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('eth.changeAddress.ethMembersStep2Url');
  });


  it('should render the otherCustomers link correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="eth.changeAddress.otherCustomersUrl"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('eth.changeAddress.otherCustomersUrl');
  });

  it('should render SVG icons in links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svgs = compiled.querySelectorAll('a svg');
    expect(svgs.length).toBeGreaterThan(0);
  });


  it('should have correct aria-labels for accessibility', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a[aria-label]');
    expect(links.length).toBeGreaterThan(0);
    links.forEach(link => {
      expect(link.getAttribute('aria-label')).toBeTruthy();
    });
  });


  it('should render mat-divider separator', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const divider = compiled.querySelector('mat-divider');
    expect(divider).toBeTruthy();
    expect(divider?.getAttribute('role')).toBe('separator');
  });


  it('should have correct number of list items', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const listItems = compiled.querySelectorAll('ol li');
    expect(listItems.length).toBe(2);
  });


  it('should have correct target="_blank" and rel="noopener" on external links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const links = compiled.querySelectorAll('a');
    links.forEach(link => {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener');
    });
  });  

});
