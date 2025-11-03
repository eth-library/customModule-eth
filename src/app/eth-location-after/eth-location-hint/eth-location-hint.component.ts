import { OnInit, Component, Input, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { catchError, map, Observable, of, switchMap } from 'rxjs';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EthUtilsService } from '../../services/eth-utils.service';
import { CommonModule } from '@angular/common';
import { SafeHtml } from '@angular/platform-browser';

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
export class EthLocationHintComponent implements OnInit  {

  hint$!: Observable<SafeHtml | null>;
  libraryCode!: string;
  subLocationCode!: string;
  @Input() hostComponent: any = {};
  
  constructor(
    private translate: TranslateService,
    private ethErrorHandlingService: EthErrorHandlingService,
    private ethUtilsService: EthUtilsService
  ){} 

  ngOnInit(): void {
    // 990010808770205503 
    this.libraryCode = this.hostComponent.location.libraryCode
    this.subLocationCode = this.hostComponent.location.subLocationCode

    if(this.libraryCode.substring(0,1) === 'E'){
      this.hint$ = this.getLocationHint().pipe(
        map(hint => this.ethUtilsService.sanitizeText(hint))
      );
    }
  }  

  private getLocationHint(): Observable<string | null> {
    return this.translate.get('customizing.location_hint.' + this.libraryCode + '.' + this.subLocationCode).pipe(
      switchMap(translation1 => {
        if (translation1 !== 'customizing.location_hint.' + this.libraryCode + '.' + this.subLocationCode) {
          return of(translation1); 
        }
        return this.translate.get('customizing.location_hint.' + this.libraryCode).pipe(
          switchMap(translation2 => {
            if (translation2 !== 'customizing.location_hint.' + this.libraryCode) {
              return of(translation2);
            }
            return of(null);
          })
        )
      }),
      catchError((error) => this.ethErrorHandlingService.handleError(error, 'EthLocationHintComponent'))
    )
  }
}


/*
customizing.location_hint.E06.E06LI      Die Bibliothek Professur für Literatur- und Kulturwissenschaft befindet sich nicht in der GESS-Bibliothek.<br> Benutzung nur vor Ort nach bestätigter Voranmeldung bei <a href="mailto:sekretariat@lit.gess.ethz.ch">sekretariat@lit.gess.ethz.ch</a> möglich.
customizing.location_hint.E01.AETH        <strong>Benutzung nur vor Ort</strong> nach Voranmeldung bei <a href="mailto:archiv@library.ethz.ch">archiv@library.ethz.ch</a>
customizing.archive_hint.ETH_ThomasMannArchiv    Informationen zum <a target="_blank" rel="noopener" href="https://vls.tma.ethz.ch/client/#/de/informationen/bestellen-und-konsultieren">Bestellen und Konsultieren</a> von Unterlagen
*/