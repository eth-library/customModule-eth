import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EthOnlineProblemComponent } from './eth-online-problem.component';
import { EthStoreService } from '../../services/eth-store.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { PnxDoc, Sourcesystem } from '../../models/eth.model';
import { TranslateService } from '@ngx-translate/core';

describe('EthOnlineProblemComponent', () => {
  let component: EthOnlineProblemComponent;
  let fixture: ComponentFixture<EthOnlineProblemComponent>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;
  let translateMock: jasmine.SpyObj<TranslateService>;

  type PnxDocOverrides = {
    pnx?: {
      display?: NonNullable<PnxDoc['pnx']>['display'];
      control?: Partial<NonNullable<PnxDoc['pnx']>['control']>;
    };
  };

  const buildPnxDoc = (overrides: PnxDocOverrides): PnxDoc => {
    const baseControl = {
      sourcerecordid: ['dummy'],
      recordid: ['dummy'],
      sourceid: ['dummy'],
      originalsourceid: ['dummy'],
      sourcesystem: [Sourcesystem.Ils]
    };

    return {
      pnx: {
        ...overrides.pnx,
        control: {
          ...baseControl,
          ...(overrides.pnx?.control ?? {})
        }
      }
    };
  };

  beforeEach(async () => {
    storeService = jasmine.createSpyObj<EthStoreService>('EthStoreService', [
      'getFullDisplayRecord$'
    ]);
    errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
    translateMock = jasmine.createSpyObj<TranslateService>('TranslateService', ['instant']);
    translateMock.instant.and.returnValue('almakb@library.ethz.ch');

    storeService.getFullDisplayRecord$.and.returnValue(of(null as unknown as PnxDoc));

    await TestBed.configureTestingModule({
      imports: [EthOnlineProblemComponent],
      providers: [
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthOnlineProblemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('sets mail link and shows link for valid record', () => {
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        control: { recordid: ['991234'] },
        display: {
          title: ['My Title'],
          creator: ['Author'],
          creationdate: ['2020'],
          publisher: ['Pub'],
          type: ['Book'],
          identifier: ['<b>ISBN</b> 978-3-16-148410-0']
        }
      }
    })));

    let mailLink: string | null | undefined;
    component.mailLink$.subscribe(value => mailLink = value);

    expect(mailLink).toContain('mailto:almakb@library.ethz.ch');
    expect(decodeURIComponent(mailLink!)).toContain('Report access problem: 991234');
    expect(decodeURIComponent(mailLink!)).toContain('ISBN 978-3-16-148410-0');
  });


  it('encodes special characters in the subject so they cannot inject mailto parameters', () => {
    storeService.getFullDisplayRecord$.and.returnValue(of(buildPnxDoc({
      pnx: {
        control: { recordid: ['991234'] },
        display: { title: ['A & B #1 ?cc=evil@example.com'] }
      }
    })));

    let mailLink: string | null | undefined;
    component.mailLink$.subscribe(value => mailLink = value);

    const queryString = mailLink!.split('?')[1];
    const paramNames = queryString.split('&').map(part => part.split('=')[0]);
    expect(paramNames).toEqual(['subject', 'body']);
    expect(new URLSearchParams(queryString).get('subject')).toBe('Report access problem: 991234 - "A & B #1 ?cc=evil@example.com"');
  });


  it('extracts ISSN and DOI identifiers', () => {
    const issnRecord = buildPnxDoc({
      pnx: {
        control: { recordid: ['991235'] },
        display: { identifier: ['$$V1234-5678 ISSN'] }
      }
    });
    const doiRecord = buildPnxDoc({
      pnx: {
        control: { recordid: ['991236'] },
        display: { identifier: ['$$V10.1234/5678 DOI'] }
      }
    });

    const issnLink = (component as any).buildMailLink(issnRecord);
    expect(decodeURIComponent(issnLink)).toContain('ISSN: 1234-5678 ISSN');

    const doiLink = (component as any).buildMailLink(doiRecord);
    expect(decodeURIComponent(doiLink)).toContain('DOI: 10.1234/5678 DOI');
  });


  it('logs errors when record stream fails', () => {
    storeService.getFullDisplayRecord$.and.returnValue(throwError(() => new Error('boom')));

    let mailLink: string | null | undefined;
    component.mailLink$.subscribe(value => mailLink = value);

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
    expect(mailLink).toBeNull();
  });
  
});
