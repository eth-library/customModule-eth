import { Component, Input } from '@angular/core';
import { EthLocationHintComponent } from './eth-location-hint/eth-location-hint.component';
import { EthLocationLinkComponent } from './eth-location-link/eth-location-link.component';
import { HostComponent } from '../models/eth.model';

@Component({
  selector: 'custom-eth-location-after',
  templateUrl: './eth-location-after.component.html',
  styleUrls: ['./eth-location-after.component.scss'],
  standalone: true,   
  imports: [
    EthLocationLinkComponent,
    EthLocationHintComponent
  ]      
})
export class EthLocationAfterComponent {
  @Input() hostComponent: HostComponent = {};
}
