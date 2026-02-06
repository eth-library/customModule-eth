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
    const loginFormContent = documentRef.createElement('nde-login-form-content');
    const dialog = documentRef.createElement('nde-login-dialog');
    const content = documentRef.createElement('div');
    content.classList.add('mat-mdc-dialog-content');
    dialog.appendChild(content);
    loginFormContent.appendChild(dialog);
    documentRef.body.appendChild(loginFormContent);

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


  it('does not insert link when it already exists', () => {
    const loginFormContent = documentRef.createElement('nde-login-form-content');
    const dialog = documentRef.createElement('nde-login-dialog');
    const content = documentRef.createElement('div');
    content.classList.add('mat-mdc-dialog-content');
    const existing = documentRef.createElement('a');
    existing.classList.add('eth-registration-link');
    dialog.appendChild(content);
    dialog.appendChild(existing);
    loginFormContent.appendChild(dialog);
    documentRef.body.appendChild(loginFormContent);

    translateMock.get.and.returnValue(of({
      'eth.registrationLink.linkText': 'Register',
      'nui.aria.newWindow': 'new window'
    }));

    component.ngAfterViewInit();

    const links = loginFormContent.querySelectorAll('a.eth-registration-link');
    expect(links.length).toBe(1);

    documentRef.body.removeChild(loginFormContent);
  });

  
  it('logs translation errors', () => {
    const loginFormContent = documentRef.createElement('nde-login-form-content');
    const dialog = documentRef.createElement('nde-login-dialog');
    const content = documentRef.createElement('div');
    content.classList.add('mat-mdc-dialog-content');
    dialog.appendChild(content);
    loginFormContent.appendChild(dialog);
    documentRef.body.appendChild(loginFormContent);

    translateMock.get.and.returnValue(throwError(() => new Error('boom')));

    component.ngAfterViewInit();

    expect(errorHandlingSpy.logError).toHaveBeenCalled();

    documentRef.body.removeChild(loginFormContent);
  });
});
