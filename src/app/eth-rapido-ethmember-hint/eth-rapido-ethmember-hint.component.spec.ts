import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { EthStoreService } from '../services/eth-store.service';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';

import { EthRapidoEthmemberHintComponent } from './eth-rapido-ethmember-hint.component';

describe('EthRapidoEthmemberHintComponent', () => {
  let component: EthRapidoEthmemberHintComponent;
  let fixture: ComponentFixture<EthRapidoEthmemberHintComponent>;
  let storeSpy: jasmine.SpyObj<EthStoreService>;

  beforeEach(async () => {
    storeSpy = jasmine.createSpyObj<EthStoreService>('EthStoreService', ['isEthMember']);
    storeSpy.isEthMember.and.returnValue(of(true));

    await TestBed.configureTestingModule({
      imports: [EthRapidoEthmemberHintComponent],
      providers: [
        { provide: EthStoreService, useValue: storeSpy },
        { provide: EthErrorHandlingService, useValue: jasmine.createSpyObj('EthErrorHandlingService', ['logError']) },
        { provide: TranslateService, useValue: jasmine.createSpyObj('TranslateService', ['instant']) }
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


  it('does not show hint when physicalTile is not set', async () => {
    component.hostComponent = {};

    const showHint = await firstValueFrom(component.showHint$);
    expect(showHint).toBeFalse();
  });
});

