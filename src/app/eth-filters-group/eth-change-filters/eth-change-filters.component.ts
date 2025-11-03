import { Component, Inject, Input, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { catchError, of, tap, Subscription, map } from 'rxjs';


@Component({
  selector: 'custom-eth-change-filters',
  templateUrl: './eth-change-filters.component.html',
  styleUrls: ['./eth-change-filters.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ] 
})
export class EthChangeFiltersComponent {
    private subscription!: Subscription;
    @Input() hostComponent: any = {};
 
    constructor(
      private renderer: Renderer2,
      private ethErrorHandlingService: EthErrorHandlingService,
      @Inject(DOCUMENT) private document: Document,
    ){}

    ngAfterViewInit (): void {
      try{
        // if there is no oa facet, hide the tlevel group, otherwise hide other tlevel values 
        if(this.hostComponent.filterGroup.id === 'tlevel'){
          this.changeTLevelElements();
        }
        // "ETH Bibliothek" group
        if(this.hostComponent.filterGroup.id === 'library'){
          this.changeLibraryGroup();
        }
      }
      catch(error: any){
          return this.ethErrorHandlingService.handleSynchronError(error, 'EthChangeFiltersComponent.ngAfterViewInit');        
      }
    }

    ngOnDestroy(): void {
      if (this.subscription) {
        this.subscription.unsubscribe();
      }
    }    

    private changeTLevelElements(): void {
      //this.hostComponent.filterList$.subscribe((f:any)=>console.log(f))
      setTimeout(() => {
        this.subscription = this.hostComponent.filterList$.pipe(
          map((list: any) => list[0]?.values.some((i: any) => i.value === "open_access")),
          tap((isOA) => {
            if (isOA) {
                const buttonOA = this.document.querySelector('nde-filters-value button[aria-label^="Open Access"]');
                if (buttonOA) {
                  const filtersValue = this.findAncestorWithTag(buttonOA as HTMLElement, 'nde-filters-value');
                  if(filtersValue){
                    this.renderer.setStyle(filtersValue, 'display', 'inline-flex');
                  }
                }
            } else{
              const heading = this.document.querySelector('nde-filters-group h3[data-qa="tlevel"]');
              if (heading) {
                const group = this.findAncestorWithTag(heading as HTMLElement, 'nde-filters-group');
                if (group) {
                  this.renderer.setStyle(group, 'display', 'none');
                }
              }
            }
          }),
          catchError((error) => {
            this.ethErrorHandlingService.handleError(error, 'EthChangeFiltersComponent.changeTLevelElements');
            return of(null);
          })
        ).subscribe();      
      }, 500)        
    }    

    private changeLibraryGroup(): void {
      setTimeout(() => {
        const libraryHeading = this.document.querySelector('nde-filters-group h3[data-qa="library"]');
        const buttonE73 = this.document.querySelector('nde-filters-value button[aria-label^="ETH Literaturarchive"]');
        if (buttonE73) {
          const filtersValue = this.findAncestorWithTag(buttonE73 as HTMLElement, 'nde-filters-value');
          if(filtersValue){
            this.renderer.setStyle(filtersValue, 'display', 'inline-flex');
          }
          if (libraryHeading) {
            this.renderer.setStyle(libraryHeading, 'display', 'block');
          }
        }else{
          if (libraryHeading) {
            const group = this.findAncestorWithTag(libraryHeading as HTMLElement, 'nde-filters-group');
            if (group) {
              this.renderer.setStyle(group, 'display', 'none');
            }
          }
        }
        // if there is group data_source: hide heading
        const dataSourceHeading = this.document.querySelector('nde-filters-group h3[data-qa="data_source"]');
        if (dataSourceHeading && libraryHeading) {
          this.renderer.setStyle(libraryHeading, 'display', 'none');
        }
      }, 500)
    }    

    private findAncestorWithTag(element: HTMLElement, tagName: string): HTMLElement | null {
      tagName = tagName.toUpperCase(); 
      let parent = element.parentElement;
      while (parent) {
        if (parent.tagName.toUpperCase() === tagName) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return null;
    }    
}

/**
 * /* filter group tlevel - hide values */
//nde-search-filters-side-nav nde-filters-group:nth-of-type(1) nde-filters-value{
//  display:none;
//}
/* filter group ETH Library - hide values */
// nde-search-filters-side-nav nde-filters-group:nth-of-type(4) nde-filters-value{
//    display:none;
// }

// /* filter group ETH Library - hide header */
// nde-search-filters-side-nav nde-filters-group:nth-of-type(4) mat-expansion-panel-header{
//     display: none;
// }

// /* reduce space divider between filter groups "Data Source" and "ETH Library" */
// nde-search-filters-side-nav nde-filters-group:nth-of-type(3) mat-expansion-panel{
//     padding-block: 0.75rem 0!important;
// }
// nde-search-filters-side-nav nde-filters-group:nth-of-type(4) mat-expansion-panel{
//     padding-block: 0 0.75rem!important; 
// }

// /* divider between filter groups "Data Source" and "ETH Library" */
// nde-search-filters-side-nav nde-filters-group:nth-of-type(3) mat-divider{
//     display: none;
// }
