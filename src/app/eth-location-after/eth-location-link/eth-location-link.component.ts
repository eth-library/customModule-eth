import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
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
    CommonModule,
    TranslateModule
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
    return this.translate.stream(`eth.locationLink.${this.libraryCode}.${this.subLocationCode}`).pipe(
      switchMap(translation1 => {
        if (translation1 !== `eth.locationLink.${this.libraryCode}.${this.subLocationCode}`) {
          return of(translation1); 
        }
  
        return this.translate.stream(`eth.locationLink.${this.libraryCode}`).pipe(
          switchMap(translation2 => {
            if (translation2 !== `eth.locationLink.${this.libraryCode}`) {
              return of(translation2); 
            }
  
            return this.translate.stream('eth.locationLink.default', {
              code: this.libraryCode,
              libraryName: this.mainLocation,
            })
          })
        )
      }),
      catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthLocationLinkComponent.getLink')) 
    )
  }
}

/*
eth.locationLink.default
<a href="https://registration.slsp.ch/libraries?search={{code}}" target="_blank">{{libraryName}}</a>

eth.locationLink.E01
<a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/lesesaal.html" target="_blank" >ETH-Bibliothek<a>

eth.locationLink.E03
<a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/baubibliothek.html" target="_blank" >Baubibliothek<a>

eth.locationLink.E06.E06LI
<a href="https://lit.ethz.ch/die-gruppe/wie-sie-uns-finden.html" target="_blank">Professur für Literatur- und Kulturwissenschaft</a>

eth.locationLink.E06.E06EQ
<a href="https://ethz.ch/staffnet/de/anstellung-und-arbeit/arbeitsumfeld/diversity.html" target="_blank">ETH Diversity</a>

eth.locationLink.E33
<a href="https://infozentrum.ethz.ch/" target="_blank" >ETH Infozentrum Chemie Biologie Pharmazie<a>
<a href="https://infozentrum.ethz.ch/en/" target="_blank" >ETH Infozentrum Chemie Biologie Pharmazie<a>

eth.locationLink.AETH
<a href="https://library.ethz.ch/archivieren-und-digitalisieren/archivieren/hochschularchiv-der-eth-zuerich.html" target="_blank" >Hochschularchiv der ETH Zürich<a>
<a href="https://library.ethz.ch/en/archiving-and-digitising/archiving/eth-zurich-university-archives.html" target="_blank" >ETH Zurich University Archives<a>


eth.locationLink.E73.E73MF
<a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/max-frisch-archiv.html" target="_blank" >ETH Max Frisch-Archiv<a>
<a href="https://library.ethz.ch/en/standorte-und-medien/standorte-und-oeffnungszeiten/max-frisch-archiv.html" target="_blank" >ETH Max Frisch-Archiv<a>

eth.locationLink.E73.E73BI
<a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/thomas-mann-archiv.html" target="_blank" >ETH Thomas-Mann-Archiv<a>
<a href="https://library.ethz.ch/en/standorte-und-medien/standorte-und-oeffnungszeiten/thomas-mann-archiv.html" target="_blank" >ETH Thomas-Mann-Archiv<a>

eth.locationLink.E76
<a href="https://library.ethz.ch/standorte-und-medien/standorte-und-oeffnungszeiten/graphische-sammlung.html" target="_blank" >ETH Graphische Sammlung<a>
<a href="https://library.ethz.ch/en/standorte-und-medien/standorte-und-oeffnungszeiten/graphische-sammlung.html" target="_blank" >ETH Graphische Sammlung<a>

eth.locationLink.E79
<a href="https://archiv.gta.arch.ethz.ch/de/bibliothek" target="_blank" >ETH gta Bibliothek<a>
<a href="https://archiv.gta.arch.ethz.ch/en/library" target="_blank" >ETH gta Bibliothek<a>


eth.locationLink.E98.E98AZ
<a href="https://afz.ethz.ch/recherche-archivbesuch/recherche/bibliothek.html" target="_blank" >Archiv für Zeitgeschichte<a>
<a href="https://afz.ethz.ch/en/search-visit/search/library.html" target="_blank" >Archives of Contemporary History<a>
*/