import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import {TranslateModule} from "@ngx-translate/core";

@Component({
  selector: 'custom-eth-change-adress',
  templateUrl: './eth-change-adress.component.html',
  styleUrls: ['./eth-change-adress.component.scss'],
  standalone: true,   
  imports: [
    CommonModule,
    MatDividerModule,
    MatCardModule,
    TranslateModule
  ]      
})
export class EthChangeAdressComponent {
}
