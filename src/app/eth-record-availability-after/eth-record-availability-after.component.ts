import { Component, Input } from '@angular/core';
import { EthDnbTocComponent } from './eth-dnb-toc/eth-dnb-toc.component';
import { EthComposeEraraComponent } from './eth-compose-erara/eth-compose-erara.component';
import { EthComposeNbComponent } from './eth-compose-nb/eth-compose-nb.component'
import { EthProvenienzEraraLinkComponent } from './eth-provenienz-erara-link/eth-provenienz-erara-link.component';

@Component({
  selector: 'custom-eth-record-availability-after',
  standalone: true,
  templateUrl: './eth-record-availability-after.component.html',
  styleUrls: ['./eth-record-availability-after.component.scss'],
  imports: [
    EthDnbTocComponent,
    EthComposeEraraComponent,
    EthComposeNbComponent,
    EthProvenienzEraraLinkComponent,
  ]
})
export class EthRecordAvailabilityAfterComponent {
  @Input() hostComponent: any = {};
}
