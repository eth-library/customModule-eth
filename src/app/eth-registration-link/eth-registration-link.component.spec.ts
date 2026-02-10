import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { of, throwError } from 'rxjs';
import { EthRegistrationLinkComponent } from './eth-registration-link.component';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

describe('EthRegistrationLinkComponent', () => {
  let component: EthRegistrationLinkComponent;
  let fixture: ComponentFixture<EthRegistrationLinkComponent>;
  let translateMock: jasmine.SpyObj<TranslateService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let documentRef: Document;

  beforeEach(async () => {
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['get']);
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError', 'logSyncError']);

    await TestBed.configureTestingModule({
      imports: [EthRegistrationLinkComponent],
      providers: [
        { provide: TranslateService, useValue: translateMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthRegistrationLinkComponent);
    component = fixture.componentInstance;
    documentRef = TestBed.inject(DOCUMENT);
  });

  const buildLoginDialog = (doc: Document) => {
    const loginFormContent = doc.createElement('nde-login-form-content');
    const dialog = doc.createElement('nde-login-dialog');
    const content = doc.createElement('div');
    content.classList.add('mat-mdc-dialog-content');
    dialog.appendChild(content);
    loginFormContent.appendChild(dialog);
    doc.body.appendChild(loginFormContent);
    return { loginFormContent, dialog, content };
  };

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('does nothing when login form content is missing', () => {
    translateMock.get.and.returnValue(of({
      'eth.registrationLink.linkText': 'Register',
      'nui.aria.newWindow': 'new window'
    }));

    component.ngAfterViewInit();

    expect(translateMock.get).not.toHaveBeenCalled();
  });


  it('inserts registration link into the login dialog', () => {
    const { loginFormContent } = buildLoginDialog(documentRef);

    translateMock.get.and.returnValue(of({
      'eth.registrationLink.linkText': 'Register',
      'nui.aria.newWindow': 'new window'
    }));

    component.ngAfterViewInit();

    const link = loginFormContent.querySelector('a.eth-registration-link') as HTMLAnchorElement | null;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toContain('swisscovery-hilfe-auf-einen-blick');

    documentRef.body.removeChild(loginFormContent);
  });


  it('sets aria label and includes an icon', () => {
    const { loginFormContent } = buildLoginDialog(documentRef);

    translateMock.get.and.returnValue(of({
      'eth.registrationLink.linkText': 'Register',
      'nui.aria.newWindow': 'new window'
    }));

    component.ngAfterViewInit();

    const link = loginFormContent.querySelector('a.eth-registration-link') as HTMLAnchorElement | null;
    const svg = link?.querySelector('svg');
    expect(link?.getAttribute('aria-label')).toBe('Register new window');
    expect(svg).toBeTruthy();

    documentRef.body.removeChild(loginFormContent);
  });


  it('does not insert link when it already exists', () => {
    const { loginFormContent, dialog, content } = buildLoginDialog(documentRef);
    const existing = documentRef.createElement('a');
    existing.classList.add('eth-registration-link');
    dialog.appendChild(existing);

    translateMock.get.and.returnValue(of({
      'eth.registrationLink.linkText': 'Register',
      'nui.aria.newWindow': 'new window'
    }));

    component.ngAfterViewInit();

    const links = loginFormContent.querySelectorAll('a.eth-registration-link');
    expect(links.length).toBe(1);

    documentRef.body.removeChild(loginFormContent);
  });


  it('re-inserts link when removed', () => {
    const { loginFormContent } = buildLoginDialog(documentRef);

    translateMock.get.and.returnValue(of({
      'eth.registrationLink.linkText': 'Register',
      'nui.aria.newWindow': 'new window'
    }));

    component.ngAfterViewInit();
    const initialLink = loginFormContent.querySelector('a.eth-registration-link');
    initialLink?.remove();

    (component as any).insertEthRegistrationLink(loginFormContent);

    const link = loginFormContent.querySelector('a.eth-registration-link');
    expect(link).toBeTruthy();

    documentRef.body.removeChild(loginFormContent);
  });

  
  it('logs translation errors', () => {
    const { loginFormContent } = buildLoginDialog(documentRef);

    translateMock.get.and.returnValue(throwError(() => new Error('boom')));

    component.ngAfterViewInit();

    expect(errorHandlingSpy.logError).toHaveBeenCalled();

    documentRef.body.removeChild(loginFormContent);
  });
});
