// In the account settings, a section for changing your address has been added below “Personal details”.
// There are two sections: one for ETH members and one for private individuals.
// https://jira.ethz.ch/browse/SLSP-2007

import { Component } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';

@Component({
  selector: 'custom-eth-change-address',
  templateUrl: './eth-change-address.component.html',
  styleUrls: ['./eth-change-address.component.scss'],
  standalone: true,   
  imports: [
    MatDividerModule,
    MatCardModule,
    SafeTranslatePipe,
    AsyncPipe
  ]      
})
export class EthChangeAddressComponent {
}
