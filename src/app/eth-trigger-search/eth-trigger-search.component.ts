import { Component, Inject, Input, Optional } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { createUrlTreeFromSnapshot, Router } from '@angular/router';

@Component({
  selector: 'custom-eth-trigger-search',
  templateUrl: './eth-trigger-search.component.html',
  styleUrls: ['./eth-trigger-search.component.scss'],
  standalone: true,   
  imports: [
    CommonModule
  ]     
})

export class EthTriggerSearchComponent {
  searchTerm: string = '';  
  @Input() hostComponent: any = {};

  constructor(
    private router: Router,
  ){}
  

  triggerSearch(event: Event) {
    let searchTerm = 'arno borst';
    let tab = 'discovery_network';

    const input = document.querySelector('nde-search-bar-presenter .search-input-field') as HTMLInputElement; 
    input.value = searchTerm;  
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    const oldTab = new URLSearchParams(window.location.search).get('tab') || null;
    if(!oldTab || (oldTab === tab)){
      const searchButton = document.querySelector('button.search-btn') as HTMLButtonElement;
      searchButton.click();
    }    
    else{
      const selectButton = document.querySelector('nde-search-contain-dropdown button') as HTMLButtonElement;
      selectButton.click();
      setTimeout(() => {
        const option = document.querySelector('[data-qa="' + tab + '"]') as HTMLElement;
        if (option) {
          option.click(); 
        }
      }, 3000);
    }
  }

  buildURL(newParams: { [key: string]: string }){
/*
    const newParams: { [key: string]: string } = { 
      mode: `simple`,
      tab: tab,
      search_scope: scope,
      query: `any,contains,${searchTerm}`      
    };

*/
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.forEach((value, key) => {
      newParams[key] = value;
    });
    const queryString = new URLSearchParams(newParams).toString();
    const url = `${location.origin}${location.pathname}?${queryString}`;
    //this.router.navigateByUrl(url);
    location.href= url;
  }

  triggerAdvancedSearch(event: Event){
    let searchTerm = '118513761';
    let field = 'lds03';
    let tab = 'discovery_network';
    let scope = 'DiscoveryNetwork';

    const currentParams = { 
      ...this.router.routerState.snapshot.root.queryParams, 
      mode: `advanced`,
      tab: tab,
      search_scope: scope,
      query: `${field},contains,${searchTerm}`
    };
    const path = this.router.url.split('?')[0]; 
    const queryString = new URLSearchParams(currentParams).toString();
    const url = `${path}?${queryString}`;
    this.router.navigateByUrl(url);
  }

}

/*

  triggerSearchByUrl2(event: Event){
    let path = this.location.path();
    const url = new URL(window.location.origin + path);
    url.searchParams.set("mode", "advanced"); 
    url.searchParams.set("query", "lds03,contains,118513761");      
    this.router.navigateByUrl(url.pathname + url.search);
  }

  triggerSearch(event: Event) {
    const input = document.querySelector('nde-search-bar-presenter .search-input-field') as HTMLInputElement; 
    input.value = "arno borst";  
    input.dispatchEvent(new Event('input', { bubbles: true }));
    this.hostComponent.dropdownService.setSelectedScope("DiscoveryNetwork");
    this.hostComponent.triggerSearchEvent("arno borst")
    //this.hostComponent.pushSearchInputToLastSearches("arno borst");
    //this.hostComponent.searchTriggered.emit({q: "arno borst", tab: "41SLSP_ETH_MyInst_and_CI", scope: "MyInst_and_CI"});
    //console.error(this.hostComponent.dropdownService.getSelectedScope())
  }

    const input = document.querySelector('nde-search-bar-presenter .search-input-field') as HTMLInputElement; 
    const dropdown = document.querySelector('nde-search-bar-presenter nde-search-contain-dropdown') as HTMLSelectElement; 
    input.value = "arno borst";  
    input.dispatchEvent(new Event('input', { bubbles: true }));
    this.hostComponent.dropdownService.setSelectedScope("DiscoveryNetwork");
    console.error( this.hostComponent.dropdownService.getSelectedScope())
    this.hostComponent.onSubmit(event);
    



  triggerAdvancedSearch(event: Event){
    let searchTerm = '118513761';
    let field = 'lds03';
    let tab = 'discovery_network';
    let scope = 'DiscoveryNetwork';

    const input = document.querySelector('nde-search-bar-presenter .search-input-field') as HTMLInputElement; 
    input.value = searchTerm;  
    input.dispatchEvent(new Event('input', { bubbles: true }));
        const matSelect = document.querySelector('mat-select[data-qa="search_tab"]') as any;
    matSelect.value = tab;
    matSelect.dispatchEvent(new CustomEvent('selectionChange', {
      bubbles: true,
      detail: { source: matSelect, value: searchTerm }
    }));

    const currentParams = { 
      ...this.route.snapshot.queryParams, 
      mode: `advanced`,
      tab: tab,
      search_scope: scope,
      query: `${field},contains,${searchTerm}`
    };
    const path = this.router.url.split('?')[0]; 
    const queryString = new URLSearchParams(currentParams).toString();
    const url = `${path}?${queryString}`;
    this.router.navigateByUrl(url);
  }
*/
