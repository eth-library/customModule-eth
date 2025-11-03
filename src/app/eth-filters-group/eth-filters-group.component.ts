import { Component, Input } from '@angular/core';
import { EthChangeFiltersComponent } from './eth-change-filters/eth-change-filters.component';

@Component({
  selector: 'custom-eth-filters-group',
  templateUrl: './eth-filters-group.component.html',
  styleUrls: ['./eth-filters-group.component.scss'],
  standalone: true,   
  imports: [
    EthChangeFiltersComponent
  ]   
})
export class EthFiltersGroupComponent {
    @Input() hostComponent: any = {};
}
