import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EthConnectedpapersComponent } from './eth-connectedpapers.component';
import { EthConnectedpapersService } from './eth-connectedpapers.service';
import { ConnectedPapersAPIResponse, PnxDoc, HostComponent } from '../models/eth.model';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { GitHintVM } from '../models/eth.model';


describe('EthConnectedpapersComponent', () => {
  let component: EthConnectedpapersComponent;
  let fixture: ComponentFixture<EthConnectedpapersComponent>;
  let cpServiceSpy: jasmine.SpyObj<EthConnectedpapersService>;
  let storeServiceSpy: jasmine.SpyObj<EthStoreService>;

  const translateMock = {
    currentLang: 'de',
    stream: (key: string) => of(key)
  };  

  beforeEach(async () => {
    cpServiceSpy = jasmine.createSpyObj('EthConnectedpapersService', ['getPaper']);
    storeServiceSpy = jasmine.createSpyObj('EthStoreService', ['getRecord$']);

    await TestBed.configureTestingModule({
      imports: [EthConnectedpapersComponent],
      providers: [
        { provide: EthConnectedpapersService, useValue: cpServiceSpy },
        { provide: EthStoreService, useValue: storeServiceSpy },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthConnectedpapersComponent);
    component = fixture.componentInstance;

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('should provide a link to connected papers', async () => {
    component.hostComponent = {searchResult: {}} as HostComponent;

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


    fixture.detectChanges();

    expect(component.paperUrl$).toBeDefined();

    const result = await firstValueFrom(component.paperUrl$);

    expect(storeServiceSpy.getRecord$).toHaveBeenCalledWith(component.hostComponent);
    expect(result).toContain('b9cc21d97d7fb24beec903a686b5c90c26d547f6');
    expect(result).toBe('https://www.connectedpapers.com/main/b9cc21d97d7fb24beec903a686b5c90c26d547f6/graph?utm_source=primonde');
    
  });

  
  it('no citations and references: should return of(null)', async () => {
    component.hostComponent = {searchResult: {}} as HostComponent;

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

    fixture.detectChanges();

    expect(component.paperUrl$).toBeDefined();

    const result = await firstValueFrom(component.paperUrl$);
    expect(result).toBeNull;
  });


  it('type book: should return of(null)', async () => {
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

    fixture.detectChanges();

    expect(component.paperUrl$).toBeDefined();

    const result = await firstValueFrom(component.paperUrl$);
    expect(result).toBeNull;
  });

});
