// Various libraries have special notes. We read these from the code tables (Bib code would be part of the code table code).
// https://jira.ethz.ch/browse/SLSP-1969

import { Component, Input, ViewEncapsulation, Inject, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, filter, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthUtilsService } from '../../services/eth-utils.service';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';
import { HostComponent } from '../../models/eth.model';

@Component({
  selector: 'custom-eth-location-hint',
  templateUrl: './eth-location-hint.component.html',
  styleUrls: ['./eth-location-hint.component.scss'],
  standalone: true,   
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
  ]     
})
export class EthLocationHintComponent {

  hint$!: Observable<SafeHtml | null>;
  libraryCode!: string; 
  subLocationCode!: string;
  id!: string;

  @Input() hostComponent: HostComponent = {};  
  @ViewChild('locationHint', { static: false }) locationHint!: ElementRef<HTMLDivElement>;
  
  constructor(
    private translate: TranslateService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethUtilsService: EthUtilsService,
    private renderer: Renderer2,
  ){} 

  ngAfterViewInit(): void {
    // 990010808770205503 
    if(!this.hostComponent?.location)return;
    this.libraryCode = this.hostComponent.location.libraryCode || '';
    this.subLocationCode = this.hostComponent.location.subLocationCode || '';
    this.id = this.hostComponent.location.ilsApiId  || '';

    if(this.libraryCode.substring(0,1) === 'E'){
      this.hint$ = this.getLocationHint().pipe(
        map(hint => this.ethUtilsService.sanitizeText(hint)),
        filter((hint): hint is string => !!hint),
        take(1),
        tap(() => {this.moveHint()}),
        catchError(error => {
          this.ethErrorHandlingService.logError(error, 'EthLocationHintComponent.ngAfterViewInit()');
          return of(null);
        })
      );
    }
  }  

  private getLocationHint(): Observable<string | null> {
    return this.translate.stream('eth.locationHint.' + this.libraryCode + '.' + this.subLocationCode, {id: this.id}).pipe( 
      switchMap(translation1 => {
        if (translation1 !== 'eth.locationHint.' + this.libraryCode + '.' + this.subLocationCode) {
          return of(translation1); 
        }
        return this.translate.stream('eth.locationHint.' + this.libraryCode, {id: this.id}).pipe(
          switchMap(translation2 => {
            if (translation2 !== 'eth.locationHint.' + this.libraryCode) {
              return of(translation2);
            }
            return of(null);
          })
        )
      }),
      catchError(err => {
        this.ethErrorHandlingService.logError(err, 'EthLocationHintComponent.getLocationHint()');
        return of(null);
      })      
    )
  }

  private moveHint() {
    setTimeout(() => {
      const hintElement = this.locationHint?.nativeElement;
      if (!hintElement) {
        return;
      }

      const location = hintElement.closest('nde-location') as HTMLElement | null;
      const newParentElement = location?.querySelector('.getit-holding-info');

      if (newParentElement && newParentElement !== hintElement.parentElement) {
        this.renderer.appendChild(newParentElement, hintElement);
      }
    }, 100);
  }  
}


/*
eth.locationHint.E06.E06LI      
Die Bibliothek Professur für Literatur- und Kulturwissenschaft befindet sich <strong>nicht</strong> in der GESS-Bibliothek.<br> <strong>Benutzung nur vor Ort</strong> nach bestätigter Voranmeldung bei <a href="mailto:sekretariat@lit.gess.ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">sekretariat@lit.gess.ethz.ch</a> möglich.
The library Chair for Literature and Cultural Studies is <strong>not</strong> located at GESS Library.<br><strong>On-site use</strong> only after confirmed appointment with <a href="mailto:sekretariat@lit.gess.ethz.ch?subject=Appointment for on-site use of MMS ID {{id}}">sekretariat@lit.gess.ethz.ch</a> possible.
                    

eth.locationHint.E06.E06EQ      
Die Bibliothek Professur für Literatur- und Kulturwissenschaft befindet sich <strong>nicht</strong> in der GESS-Bibliothek.<br> <strong>Benutzung nur vor Ort</strong> nach bestätigter Voranmeldung bei <a href="mailto:diversity@ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">diversity@ethz.ch</a> möglich.
The library Chair for Literature and Cultural Studies is <strong>not</strong> located at GESS Library.<br><strong>On-site use</strong> only after confirmed appointment with <a href="mailto:diversity@ethz.ch?subject=Appointment for on-site use of MMS ID {{id}}">diversity@ethz.ch</a> possible.

eth.locationHint.E33
Möchten Sie einen Scan eines Artikels oder Kapitels aus diesem Dokument bestellen? <a href="mailto:infodesk@chem.ethz.ch?subject=Scan request: MMS ID {{id}}">Schreiben Sie uns!</a>
Would you like to order a scan of an article or a chapter from this document? <a href="mailto:infodesk@chem.ethz.ch?subject=Scan-Anfrage: MMS ID {{id}}">Write to us!</a>


eth.locationHint.E01.AETH
<strong>Benutzung nur vor Ort</strong> nach Voranmeldung bei <a href="mailto:archiv@library.ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">archiv@library.ethz.ch</a>
<strong>On-site use</strong> only after appointment with <a href="mailto:archiv@library.ethz.ch?subject=Appointment for on-site use of MMS ID {{id}}">archiv@library.ethz.ch</a>


eth.archiveHint.ETH_ThomasMannArchiv    Informationen zum <a target="_blank" rel="noopener" href="https://vls.tma.ethz.ch/client/#/de/informationen/bestellen-und-konsultieren">Bestellen und Konsultieren</a> von Unterlagen


eth.locationHint.E73.E73MF
Benutzung nur vor Ort. Auskunft erhalten Sie per E-Mail an: <a href="mailto:mfa@library.ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">mfa@library.ethz.ch</a> 
Use only on site. Information can be obtained by e-mail to:  <a href="mailto:mfa@library.ethz.ch?subject=Appointment for on-site use of MMS ID {{id}}">mfa@library.ethz.ch</a> 


eth.locationHint.E73.E73BI
Benutzung nur vor Ort. Auskunft erhalten Sie per E-Mail an: <a href="mailto:tma@library.ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">tma@library.ethz.ch</a> 
Use only on site. Information can be obtained by e-mail to:  <a href="mailto:tma@library.ethz.ch?subject=Appointment for on-site use of MMS ID {{id}}">tma@library.ethz.ch</a> 


eth.locationHint.E76
Benutzung vor Ort nur nach bestätigter Voranmeldung bei <a href="mailto:bibliothek@gs.ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">bibliothek@gs.ethz.ch</a> 
On-site use only after confirmed appointment with <a href="mailto:bibliothek@gs.ethz.ch?subject=Appointment for on-site use von MMS ID {{id}}">bibliothek@gs.ethz.ch</a> 


eth.locationHint.E79
<strong>Benutzung nur vor Ort</strong> nach bestätigter Voranmeldung bei <a href="mailto:bibliothek@gta.arch.ethz.ch?subject=Voranmeldung für Benutzung vor Ort von MMS ID {{id}}">bibliothek@gta.arch.ethz.ch</a>
<strong>On-site use</strong> only after confirmed appointment with <a href="mailto:bibliothek@gta.arch.ethz.ch?subject=Appointment for on-site use of MMS ID {{id}}">bibliothek@gta.arch.ethz.ch</a>

*/ 