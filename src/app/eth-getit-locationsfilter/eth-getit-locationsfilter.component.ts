// The filters by location, volume, etc. are displayed initially and are expanded by default.
// https://jira.ethz.ch/browse/SLSP-2355

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { HostComponent } from '../models/eth.model';

@Component({
  selector: 'custom-eth-getit-locationsfilter',
  template: '',
  standalone: true,   
  imports: [
    CommonModule
  ]      
})
export class EthGetitLocationsfilterComponent implements OnInit{

  @Input() hostComponent: HostComponent = {};

  ngOnInit(): void {
    this.hostComponent.filtersVisible = true; 
  }
  
}
