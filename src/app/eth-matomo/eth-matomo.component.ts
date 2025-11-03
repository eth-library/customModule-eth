import { Component } from '@angular/core';
import { EthMatomoService } from './eth-matomo.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'custom-eth-matomo',
  templateUrl: './eth-matomo.component.html',
  styleUrls: ['./eth-matomo.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ]   
})

export class EthMatomoComponent {
  constructor(private ethMatomoService: EthMatomoService) {
    this.ethMatomoService.loadMatomo();
  }
}
