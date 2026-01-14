import { Component, Input } from '@angular/core';
import { EthExpandComponent } from './eth-expand/eth-expand.component'
import { HostComponent } from '../models/eth.model';

@Component({
  selector: 'custom-eth-full-display-service-container-after',
  templateUrl: './eth-full-display-service-container-after.component.html',
  styleUrls: ['./eth-full-display-service-container-after.component.scss'],
  standalone: true,
  imports: [
    EthExpandComponent
  ]   
})
export class EthFullDisplayServiceContainerAfterComponent {
  @Input() hostComponent: HostComponent = {};
}
