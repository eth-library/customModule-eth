import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';

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

/**
  label: {
      heading: {
          de: 'Adresse bearbeiten',
          en: 'Address changes'
      },
      ethMembers: {
          de: 'ETH-Angehörige',
          en: 'Members of ETH'
      },
      ethMembersIntro: {
          de: 'Ändern Sie Ihre Adresse in 2 Schritten:',
          en: 'Change your address in 2 steps:'
      },
      ethMembersStep1: {
          de: 'Adresse ändern:',
          en: 'change address:'
      },
      ethMembersStep2: {
          de: 'Adressänderung bestätigen:',
          en: 'confirm address change:'
      },
      otherCustomers: {
          de: 'Privatpersonen',
          en: 'Private individuals'
      },
      otherCustomersIntro: {
          de: 'Ändern Sie Ihre Adresse hier:',
          en: 'Change your address here:'
      }
  },
  url: {
      ethMembersStep1: {
          de: 'https://www.bi.id.ethz.ch/eAdressen',
          en: 'https://www.bi.id.ethz.ch/eAdressen/index_en.jsp'
      },
      ethMembersStep2: {
          de: 'https://eduid.ch',
          en: 'https://eduid.ch'
      },
      otherCustomers: {
          de: 'https://eduid.ch',
          en: 'https://eduid.ch'
      }
  }


 */