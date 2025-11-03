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
  
  constructor(){
    //console.error("nde-full-display-service-container", this.hostComponent)
    if(this.hostComponent._service.type === 'nui.brief.results.tabs.links'){
      this.hostComponent.isOpen = true;
    }
  }  

}