import { Component } from '@angular/core';

import { EthWaybackComponent } from './eth-wayback/eth-wayback.component';
import { EthLibraryStackComponent } from './eth-library-stack/eth-library-stack.component';
import { EthOnlineProblemComponent } from './eth-online-problem/eth-online-problem.component';
//import { EthIllLinkComponent } from '../eth-ill-link/eth-ill-link.component';

@Component({
  selector: 'custom-eth-view-it-after',
  standalone: true,
  imports: [
    EthOnlineProblemComponent,
    EthWaybackComponent,
    EthLibraryStackComponent,
    //EthIllLinkComponent
  ],
  templateUrl: './eth-view-it-after.component.html',
  styleUrl: './eth-view-it-after.component.scss'
})
export class EthViewItAfterComponent {

}
