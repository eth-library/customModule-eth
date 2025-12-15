// The location filter should be displayed initially
// https://jira.ethz.ch/browse/SLSP-2355

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

  ngOnInit(): void {
    this.hostComponent.filtersVisible = true; 
  }
}