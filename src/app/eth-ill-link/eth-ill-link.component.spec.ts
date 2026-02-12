import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, firstValueFrom } from 'rxjs';
import { EthIllLinkComponent } from './eth-ill-link.component';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { DOCUMENT } from '@angular/common';

describe('EthIllLinkComponent', () => {
  let component: EthIllLinkComponent;
  let fixture: ComponentFixture<EthIllLinkComponent>;

  let storeServiceMock: any;
  const translateMock: any = {
    stream: (key: string) => of(key),
  };
  const errorHandlingMock = { logError: () => {}, logSyncError: () => {} };

  beforeEach(async () => {
    // default: no ILL (availability not "no_inventory")
    storeServiceMock = {
      getFullDisplayRecord$: () => of(null),
      getFullDisplayDeliveryEntity$: () =>
        of({ delivery: { availability: ['available'] } })
    };

    await TestBed.configureTestingModule({
      imports: [EthIllLinkComponent],
      providers: [
        { provide: EthStoreService, useValue: storeServiceMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingMock },
        { provide: DOCUMENT, useValue: document }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EthIllLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('no ill link when availability is not "no_inventory"', async () => {
    // default mocked availability = 'available'
    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeNull();
  });


  it('no ill link when nde-get-it-from-other element exists', async () => {
    // set availability to no_inventory but add nde-get-it-from-other element -> should be null
    storeServiceMock.getFullDisplayDeliveryEntity$ = () =>
      of({ delivery: { availability: ['no_inventory'] } });

    // add element that blocks ILL
    const blocker = document.createElement('nde-get-it-from-other');
    document.body.appendChild(blocker);

    fixture.detectChanges();

    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeNull();

    blocker.remove();
  });


  it('ill link when no_inventory and rapido no-offer element exists', async () => {
    if (fixture) {
      fixture.destroy();
    }
  
    const record = {
      pnx: {
        display: {
          title: ['Some Title'],
          creator: ['Author'],
          creationdate: ['2020'],
          publisher: ['Pub'],
          identifier: ['ISBN: 978-3-16-148410-0']
        },
        addata: {}
      }
    };
  
    const storeServiceMock = {
      getFullDisplayRecord$: () => of(record),
      getFullDisplayDeliveryEntity$: () =>
        of({ delivery: { availability: ['no_inventory'] } })
    };
  
    // Reconfigure TestBed
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EthIllLinkComponent],
      providers: [
        { provide: EthStoreService, useValue: storeServiceMock },
        { provide: TranslateService, useValue: translateMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingMock },
        { provide: DOCUMENT, useValue: document }
      ]
    }).compileComponents();
  
    // add rapido noOffer element BEFORE component init
    const rapido = document.createElement('div');
    rapido.setAttribute('data-qa', 'rapido.tiles.noOfferTileLine1');
    document.body.appendChild(rapido);
  
    fixture = TestBed.createComponent(EthIllLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  
    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeTruthy();
    expect(qs).toContain('jtitle=Some%20Title');
    expect(qs).toContain('au=Author');
  
    rapido.remove();
  });  
  

  it('url$ builds full url from translation when qs present', async () => {
    // Cleanup old fixture first
    if (fixture) {
      fixture.destroy();
    }
  
    // Setup mocks BEFORE configureTestingModule
    const record = {
      pnx: {
        display: {
          title: ['Some Title'],
          creator: ['Author'],
          creationdate: ['2020'],
          publisher: ['Pub'],
          identifier: ['ISBN: 978-3-16-148410-0']
        },
        addata: {}
      }
    };
  
    const storeServiceMock = {
      getFullDisplayRecord$: () => of(record),
      getFullDisplayDeliveryEntity$: () =>
        of({ delivery: { availability: ['no_inventory'] } })
    };
  
    const newTranslateMock = {
      stream: (key: string) =>
        of(key === 'eth.illLink.url' ? 'https://ill.example/ill' : key)
    };
  
    // Reconfigure TestBed with new mocks
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [EthIllLinkComponent],
      providers: [
        { provide: EthStoreService, useValue: storeServiceMock },
        { provide: TranslateService, useValue: newTranslateMock },
        { provide: EthErrorHandlingService, useValue: errorHandlingMock },
        { provide: DOCUMENT, useValue: document }
      ]
    }).compileComponents();
  
    // ensure rapido element exists so qs is produced
    const rapido = document.createElement('div');
    rapido.setAttribute('data-qa', 'rapido.tiles.noOfferTileLine1');
    document.body.appendChild(rapido);
  
    // Now create component
    fixture = TestBed.createComponent(EthIllLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  
    const qs = await firstValueFrom(component.qs$);
    expect(qs).toBeTruthy();
  
    const url = await firstValueFrom(component.url$);
    expect(url).toBe(`https://ill.example/ill?${qs}`);
  
    rapido.remove();
  });  

});