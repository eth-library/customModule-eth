import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EthOnlineProblemComponent } from './eth-online-problem.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthErrorHandlingService } from 'src/app/services/eth-error-handling.service';
import { PnxDoc, Sourcesystem } from '../../models/eth.model';

describe('EthOnlineProblemComponent', () => {
  let component: EthOnlineProblemComponent;
  let fixture: ComponentFixture<EthOnlineProblemComponent>;
  let storeService: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

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

    storeService.getFullDisplayRecord$.and.returnValue(of(null as unknown as PnxDoc));

    await TestBed.configureTestingModule({
      imports: [EthOnlineProblemComponent],
      providers: [
        { provide: EthStoreService, useValue: storeService },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
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

    let showLink: boolean | undefined;
    component.showLink$.subscribe(value => showLink = value);

    expect(showLink).toBeTrue();
    expect(component.mailLink).toContain('mailto:almakb@library.ethz.ch');
    expect(component.mailLink).toContain('Report access problem: 991234');
    expect(decodeURIComponent(component.mailLink)).toContain('ISBN 978-3-16-148410-0');
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

    (component as any).setMailLink(issnRecord);
    expect(decodeURIComponent(component.mailLink)).toContain('ISSN: 1234-5678 ISSN');

    (component as any).setMailLink(doiRecord);
    expect(decodeURIComponent(component.mailLink)).toContain('DOI: 10.1234/5678 DOI');
  });

  it('logs errors when record stream fails', () => {
    storeService.getFullDisplayRecord$.and.returnValue(throwError(() => new Error('boom')));

    component.showLink$.subscribe();

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
  });
});
