import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Pipe, PipeTransform } from '@angular/core';
import { EthChangeAdressComponent } from './eth-change-adress.component';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

// Mock TranslateService
const translateServiceMock = {
  currentLang: 'de',
  onLangChange: of({ lang: 'de' }),
  get: (key: string) => of(key),
  stream: (key: string) => of(key)
};

// Mock TranslatePipe
@Pipe({ name: 'translate' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value; 
  }
}

describe('EthChangeAdressComponent', () => {
  let component: EthChangeAdressComponent;
  let fixture: ComponentFixture<EthChangeAdressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EthChangeAdressComponent],      
      declarations: [MockTranslatePipe],        
      providers: [
        { provide: TranslateService, useValue: translateServiceMock } 
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthChangeAdressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create the component', () => {
    expect(component).toBeTruthy();
  });


  it('should render the main heading', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const heading = compiled.querySelector('h3');
    expect(heading?.textContent).toContain('eth.changeAdress.heading');
  });


  it('should render the ethMembers section headings', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const subHeadings = compiled.querySelectorAll('h4');
    const texts = Array.from(subHeadings).map(el => el.textContent);
    expect(texts).toContain('eth.changeAdress.ethMembers');
    expect(texts).toContain('eth.changeAdress.otherCustomers');
  });


  it('should render the ethMembersStep1 link correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="eth.changeAdress.ethMembersStep1Url"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('eth.changeAdress.ethMembersStep1Url');
  });


  it('should render the ethMembersStep2 link correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="eth.changeAdress.ethMembersStep2Url"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('eth.changeAdress.ethMembersStep2Url');
  });


  it('should render the otherCustomers link correctly', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a[href="eth.changeAdress.otherCustomersUrl"]');
    expect(link).toBeTruthy();
    expect(link?.textContent).toContain('eth.changeAdress.otherCustomersUrl');
  });

});
