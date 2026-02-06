// An option to change the address is added to the account settings page.
// https://jira.ethz.ch/browse/SLSP-2007

import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'custom-eth-change-address',
  templateUrl: './eth-change-address.component.html',
  styleUrls: ['./eth-change-address.component.scss'],
  standalone: true,   
  imports: [
    MatDividerModule,
    MatCardModule,
    TranslateModule
  ]      
})
export class EthChangeAddressComponent {
}
