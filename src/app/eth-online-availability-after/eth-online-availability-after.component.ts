import { Component, Input } from '@angular/core';
//import { EthBrowzineComponent } from './eth-browzine/eth-browzine.component';
//import { EthFulltextComponent } from './eth-fulltext/eth-fulltext.component';
import { tap } from 'rxjs';


  
@Component({
  selector: 'custom-eth-online-availability-after',
  standalone: true,
  templateUrl: './eth-online-availability-after.component.html',
  styleUrls: ['./eth-online-availability-after.component.scss'],
  imports: [
    //EthBrowzineComponent,
    //EthFulltextComponent,
  ]  
})
export class EthOnlineAvailabilityAfterComponent {
  @Input() hostComponent: any = {};
}