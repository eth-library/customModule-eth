import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EthConnectedpapersComponent } from './eth-connectedpapers.component';
import { EthConnectedpapersService } from './eth-connectedpapers.service';
import { ConnectedPapersAPIResponse, PnxDoc, HostComponent } from '../models/eth.model';
import { EthStoreService } from '../services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { firstValueFrom, of, throwError } from 'rxjs';


describe('EthConnectedpapersComponent', () => {
  let component: EthConnectedpapersComponent;
  let fixture: ComponentFixture<EthConnectedpapersComponent>;
  let cpServiceSpy: jasmine.SpyObj<EthConnectedpapersService>;
  let storeServiceSpy: jasmine.SpyObj<EthStoreService>;
  let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

  const translateMock = {
    currentLang: 'de',
    stream: (key: string) => of(key)
  };  


  beforeEach(async () => {
    cpServiceSpy = jasmine.createSpyObj('EthConnectedpapersService', ['getPaper']);
    storeServiceSpy = jasmine.createSpyObj('EthStoreService', ['getRecord$']);
    errorHandlingSpy = jasmine.createSpyObj('EthErrorHandlingService', ['logError', 'logError']);

    await TestBed.configureTestingModule({
      imports: [EthConnectedpapersComponent],
      providers: [
        { provide: EthConnectedpapersService, useValue: cpServiceSpy },
        { provide: EthStoreService, useValue: storeServiceSpy },
        { provide: EthErrorHandlingService, useValue: errorHandlingSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthConnectedpapersComponent);
    component = fixture.componentInstance;

    component.hostComponent = {searchResult: {}} as HostComponent;    

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('does nothing when no hostComponent is provided', async () => {
    component.hostComponent = {} as HostComponent;
    expect(storeServiceSpy.getRecord$).not.toHaveBeenCalled();

    const result = await firstValueFrom(component.paperUrl$);
    expect(result).toBeNull();
  });


  it('should provide a link to connected papers if it is an article', async () => {
    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: { doi: ['10.1093/nar/gkl986'] },
          display: { type: ['article'] }
        }
      } as PnxDoc)
    );

    cpServiceSpy.getPaper.and.returnValue(of({
      citationCount: 0,
      referenceCount: 2,
      id:"b9cc21d97d7fb24beec903a686b5c90c26d547f6"
    } as ConnectedPapersAPIResponse));

    expect(component.paperUrl$).toBeDefined();

    const result = await firstValueFrom(component.paperUrl$);

    expect(storeServiceSpy.getRecord$).toHaveBeenCalledWith(component.hostComponent);
    expect(result).toContain('b9cc21d97d7fb24beec903a686b5c90c26d547f6');
    expect(result).toBe('https://www.connectedpapers.com/main/b9cc21d97d7fb24beec903a686b5c90c26d547f6/graph?utm_source=primonde');
    
  });


  it('renders the connected papers button', async () => {
    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: { doi: ['10.1093/nar/gkl986'] },
          display: { type: ['article'] }
        }
      } as PnxDoc)
    );

    cpServiceSpy.getPaper.and.returnValue(of({
      citationCount: 3,
      referenceCount: 0,
      id: 'b9cc21d97d7fb24beec903a686b5c90c26d547f6'
    } as ConnectedPapersAPIResponse));

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('a.eth-connectedpapers-link') as HTMLAnchorElement | null;

    expect(button).not.toBeNull();
    expect(button?.textContent?.trim()).toBe('Connected Papers');
    expect(button?.getAttribute('href')).toBe('https://www.connectedpapers.com/main/b9cc21d97d7fb24beec903a686b5c90c26d547f6/graph?utm_source=primonde');
  });

  
  it('no citations and references: should return of(null) -> no link rendered', async () => {
    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: { doi: ['10.1093/nar/gkl986'] },
          display: { type: ['article'] }
        }
      } as PnxDoc)
    );

    cpServiceSpy.getPaper.and.returnValue(of({
      citationCount: 0,
      referenceCount: 0,
      id:"b9cc21d97d7fb24beec903a686b5c90c26d547f6"
    } as ConnectedPapersAPIResponse));

    expect(component.paperUrl$).toBeDefined();

    const result = await firstValueFrom(component.paperUrl$);
    expect(result).toBeNull();
  });


  it('returns null for an invalid API response without an id', async () => {
    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: { doi: ['10.1093/nar/gkl986'] },
          display: { type: ['article'] }
        }
      } as PnxDoc)
    );

    cpServiceSpy.getPaper.and.returnValue(of({
      citationCount: 3,
      referenceCount: 0
    } as ConnectedPapersAPIResponse));

    const result = await firstValueFrom(component.paperUrl$);

    expect(result).toBeNull();
  });


  it('type book: should return of(null) -> no link rendered', async () => {
    component.hostComponent = {searchResult: {}} as HostComponent;

    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: { doi: ['10.1093/nar/gkl986'] },
          display: { type: ['book'] }
        }
      } as PnxDoc)
    );

    cpServiceSpy.getPaper.and.returnValue(of({
      citationCount: 20,
      referenceCount: 5,
      id:"b9cc21d97d7fb24beec903a686b5c90c26d547f6"
    } as ConnectedPapersAPIResponse));

    expect(component.paperUrl$).toBeDefined();

    const result = await firstValueFrom(component.paperUrl$);
    expect(result).toBeNull();
  });


  it('missing doi: should return of(null) -> no link rendered', async () => {
    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: {},
          display: { type: ['article'] }
        }
      } as PnxDoc)
    );

    //fixture.detectChanges();

    const result = await firstValueFrom(component.paperUrl$);

    expect(cpServiceSpy.getPaper).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  
  it('logs errors when connected papers service fails', async () => {
    storeServiceSpy.getRecord$.and.returnValue(
      of({
        pnx: {
          addata: { doi: ['10.1093/nar/gkl986'] },
          display: { type: ['article'] }
        }
      } as PnxDoc)
    );

    cpServiceSpy.getPaper.and.returnValue(throwError(() => new Error('boom')));

    //fixture.detectChanges();

    const result = await firstValueFrom(component.paperUrl$);

    expect(errorHandlingSpy.logError).toHaveBeenCalled();
    expect(result).toBeNull();
  });

});
