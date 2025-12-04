import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'custom-eth-getit-locationsfilter',
  templateUrl: './eth-getit-locationsfilter.component.html',
  styleUrls: ['./eth-getit-locationsfilter.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ]      
})
export class EthGetitLocationsfilterComponent{

  @Input() hostComponent: any = {};

  constructor(){
    //console.error("nde-get-it ", this.hostComponent)
    this.hostComponent.filtersVisible = true; 
  }  
}