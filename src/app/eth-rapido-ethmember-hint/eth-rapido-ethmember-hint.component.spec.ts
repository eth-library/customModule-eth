import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, firstValueFrom, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

import { EthRapidoEthmemberHintComponent } from './eth-rapido-ethmember-hint.component';

describe('EthRapidoEthmemberHintComponent', () => {
  let component: EthRapidoEthmemberHintComponent;
  let fixture: ComponentFixture<EthRapidoEthmemberHintComponent>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;
  let isEthMember$: BehaviorSubject<boolean>;
  const translateMock = {
    currentLang: 'de',
    stream: (key: string) => of(key)
  };

  beforeEach(async () => {
    isEthMember$ = new BehaviorSubject<boolean>(true);
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', ['isEthMember']);
    storeSpy.isEthMember.and.returnValue(isEthMember$.asObservable());

    await TestBed.configureTestingModule({
      imports: [EthRapidoEthmemberHintComponent],
      providers: [
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: jasmine.createSpyObj('EthErrorHandlingService', ['logError']) },
        { provide: TranslateService, useValue: translateMock }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EthRapidoEthmemberHintComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });


  it('shows hint for digital tile (physicalTile === false)', async () => {
    component.hostComponent = { physicalTile: false };

    expect(storeSpy.isEthMember).toHaveBeenCalledTimes(1);
    const showHint = await firstValueFrom(component.showHint$);
    expect(showHint).toBeTrue();
  });

  
  it('does not show hint for physical tile (physicalTile === true)', async () => {
    component.hostComponent = { physicalTile: true };

    const showHint = await firstValueFrom(component.showHint$);
    expect(showHint).toBeFalse();
  });


  it('shows hint when physicalTile is not set', async () => {
    component.hostComponent = {};

    const showHint = await firstValueFrom(component.showHint$);
    expect(showHint).toBeTrue();
  });


  it('shows hint when physicalTile is null', async () => {
    component.hostComponent = { physicalTile: null as any };

    const showHint = await firstValueFrom(component.showHint$);
    expect(showHint).toBeTrue();
  });


  it('reacts to ETH member changes for digital tile', async () => {
    component.hostComponent = { physicalTile: false };
    const showHintValues: boolean[] = [];
    const subscription = component.showHint$.subscribe(value => showHintValues.push(value));

    isEthMember$.next(false);

    expect(showHintValues).toEqual([true, false]);
    subscription.unsubscribe();
  });
});

