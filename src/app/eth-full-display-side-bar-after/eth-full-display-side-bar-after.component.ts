import { Component, Input } from '@angular/core';
import { EthGeoRefComponent } from './eth-geo-ref/eth-geo-ref.component';
import { EthPersonCardsComponent } from './eth-person-cards/eth-person-cards.component';
import { EthProvenienzComponent } from './eth-provenienz/eth-provenienz.component';


@Component({
  selector: 'custom-eth-full-display-side-bar-after',
  templateUrl: './eth-full-display-side-bar-after.component.html',
  styleUrls: ['./eth-full-display-side-bar-after.component.scss'],
  standalone: true,
  imports: [
    EthProvenienzComponent,
    EthPersonCardsComponent,
    EthGeoRefComponent
  ]     
})
export class EthFullDisplaySideBarAfterComponent {
    @Input() hostComponent: any = {};
}

