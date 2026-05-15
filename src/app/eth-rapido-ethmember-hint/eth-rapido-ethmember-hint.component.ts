// Rapido digtal tile: If users are ETH members, a message is shown in Rapido’s digital tile: 
// Please check in the top section of the order form whether an ETH Zurich library offers a ‘Digitisation’ service (free of charge).
// https://jira.ethz.ch/browse/SLSP-2012

import { Component, Input, ViewEncapsulation } from '@angular/core';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe'; 
import { EthStoreService } from '../services/eth-store.service';
import { HostComponent } from '../models/eth.model';


@Component({
  selector: 'custom-eth-rapido-ethmember-hint',
  standalone: true,
  templateUrl: './eth-rapido-ethmember-hint.component.html',
  styleUrls: ['./eth-rapido-ethmember-hint.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    SafeTranslatePipe
  ]     
})
// 990050929800205503
export class EthRapidoEthmemberHintComponent {
  
  private hostComponent$ = new BehaviorSubject<HostComponent>({});

  @Input() 
  set hostComponent(value: HostComponent) {
    this.hostComponent$.next(value);
  }

  showHint$: Observable<boolean> = this.hostComponent$.pipe(
    switchMap(host => {
        return host?.physicalTile === false ? this.ethStoreService.isEthMember() : of(false)
      }
    )
  );
  
  constructor(
    private ethStoreService: EthStoreService,
  ) {}
 
}