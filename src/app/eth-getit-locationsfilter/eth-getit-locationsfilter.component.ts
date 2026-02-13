// The location filter should be displayed initially
// https://jira.ethz.ch/browse/SLSP-2355

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { HostComponent } from '../models/eth.model';

@Component({
  selector: 'custom-eth-getit-locationsfilter',
  templateUrl: './eth-getit-locationsfilter.component.html',
  styleUrls: ['./eth-getit-locationsfilter.component.scss'],
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
