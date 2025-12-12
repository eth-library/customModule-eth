// The containers for viewit_other and getit_other should be initially collapsed.
// https://jira.ethz.ch/browse/SLSP-2353

import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'custom-eth-expand',
  templateUrl: './eth-expand.component.html',
  styleUrls: ['./eth-expand.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ]    
})
export class EthExpandComponent {
  @Input() hostComponent: any = {};

  ngAfterViewInit(){
    //console.error("nde-full-display-service-container", this.hostComponent._service.type)
    if(this.hostComponent._service.type === 'nui.brief.results.tabs.getit_other' || this.hostComponent._service.type === 'nui.brief.results.tabs.viewit_other'){
      //console.error("nde-full-display-service-container", this.hostComponent)
      this.hostComponent.isOpen = false;
    }
  }

}