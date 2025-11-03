import { Component, Inject, Input, OnInit, Optional, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthUtilsService } from '../../services/eth-utils.service';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'custom-eth-location-link',
  templateUrl: './eth-location-link.component.html',
  styleUrls: ['./eth-location-link.component.scss'],
  standalone: true,   
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule
  ]     
})
export class EthLocationLinkComponent implements OnInit  {

  link$!: Observable<SafeHtml | null>;
  libraryCode!: string;
  subLocationCode!: string;
  mainLocation!: string;
  @Input() hostComponent: any = {};
  
  constructor(
    private translate: TranslateService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethUtilsService: EthUtilsService
  ){} 

  ngOnInit(): void {
    // console.log(this.hostComponent.location)
    // 990010808770205503 
    this.hostComponent.expanded = true;
    this.subLocationCode = this.hostComponent?.location?.subLocationCode ?? '';
    this.libraryCode = this.hostComponent?.location?.libraryCode ?? '';
    this.mainLocation = this.hostComponent?.location?.mainLocation ?? '';
    this.link$ = this.getLink().pipe(
      map(text => this.ethUtilsService.sanitizeText(text))
    );
  }

  private getLink(): Observable<string> {    
    return this.translate.get(`customizing.location_link.${this.libraryCode}.${this.subLocationCode}`).pipe(
      switchMap(translation1 => {
        if (translation1 !== `customizing.location_link.${this.libraryCode}.${this.subLocationCode}`) {
          return of(translation1); 
        }
  
        return this.translate.get(`customizing.location_link.${this.libraryCode}`).pipe(
          switchMap(translation2 => {
            if (translation2 !== `customizing.location_link.${this.libraryCode}`) {
              return of(translation2); 
            }
  
            return this.translate.get('customizing.location_link.default', {
              code: this.libraryCode,
              libraryName: this.mainLocation,
            })
          })
        )
      }),
      catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthLocationLinkComponent')) 
    )
  }
}

/*
customizing.location_link.default    <a href="https://registration.slsp.ch/libraries?search={{code}}" target="_blank">{{libraryName}}</a>
customizing.location_link.E01       <a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/lesesaal.html" target="_blank" >ETH-Bibliothek<a>
customizing.location_link.E03       <a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/baubibliothek.html" target="_blank" >Baubibliothek<a>
customizing.location_link.E06.E06LI  <a href="https://lit.ethz.ch/die-gruppe/wie-sie-uns-finden.html" target="_blank">Professur für Literatur- und Kulturwissenschaft</a>
*/