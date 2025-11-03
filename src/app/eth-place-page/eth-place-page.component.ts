import { Component, Renderer2, ViewEncapsulation } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthPlacePageService } from './eth-place-page.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from "@ngx-translate/core";


@Component({
  selector: 'custom-eth-place-page',
  templateUrl: './eth-place-page.component.html',
  styleUrls: ['./eth-place-page.component.scss'],
  standalone: true,   
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    TranslateModule    
  ]    
})
export class EthPlacePageComponent {
  
  placeData$!: Observable<any>;
  qid: string = '';
  vid!: string|null;
  lang!: string
  searchValue$!: Observable<string>;
  labelOpenInNew$!: Observable<string>;

  constructor(
    private translate: TranslateService,
    private ethStoreService:EthStoreService,
    public ethPlacePageService: EthPlacePageService,
    private renderer: Renderer2,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}  

  ngOnInit(): void {
    this.labelOpenInNew$ = this.translate.get(`nui.aria.newWindow`);
    this.searchValue$ = this.ethStoreService.searchValue$;
    this.placeData$ = this.searchValue$.pipe(
      switchMap((searchValue: string) => {
          return this.initPlacePage(searchValue);
      })
    )
  }  

  initPlacePage(searchValue: string): Observable<any | null> {
    this.lang = this.translate.currentLang;
    this.vid = this.ethStoreService.getVid();
    if(searchValue && searchValue.includes('[wd/place]')){
      this.qid = searchValue.substring(searchValue.indexOf(']') + 1);
    }
    if(this.qid === '') {
      return of(null);
    }

    return forkJoin({
      geoTopics: this.ethPlacePageService.getTopicsFromGeoGraph(this.qid, this.lang).pipe(catchError(() => of(null))),
      geoPoi: this.ethPlacePageService.getPoiFromGeoGraph(this.qid, this.lang).pipe(catchError(() => of(null))),
      ethorama: this.ethPlacePageService.getPlaceFromETHorama(this.qid, this.lang).pipe(catchError(() => of(null))),
      wikidata: this.ethPlacePageService.getPlaceFromWikidata(this.qid, this.lang).pipe(catchError(() => of(null))),
    }).pipe(
      map(
        ({ geoTopics, geoPoi, ethorama, wikidata }) => {
          return this.processAllData(geoTopics, geoPoi, ethorama, wikidata);
        }
      ),
      tap(()=>{
        // hide search result container
        const observer = new MutationObserver(() => {
          const target = document.querySelector('.search-result-content');
          if (target) {
            this.renderer.setStyle(target, 'display', 'none');
            observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });        
      })
    );

  }
    
  private processAllData(geoTopics: any,geoPoi: any, ethorama: any, wikidata: any): any {
    const topics = this.processGeoTopics(geoTopics);
    const poi = this.processGeoPoi(geoPoi);
    const etho = this.processETHorama(ethorama);
    const wiki = this.processWikidata(wikidata);
    //console.error('all', {topics: topics,poi: poi,ethorama: etho,wikidata: wiki});

    return {
      topics: topics,
      poi: poi,
      ethorama: etho,
      wikidata: wiki
    };
  }

  processETHorama(response: any){
      let place: any = {};
      if(response && response.items && response.items.length > 0){
          place = response.items[0];
      }
      else{
          return null;
      }
      place.qid = this.qid;
      const contentItems: any[] = []
      place.contentItems.forEach((item1:any) => {
          let dupl = false;
          contentItems.forEach(item2 => {
              if(item2.docId === item1.docId){
                  dupl = true;
              }
          })
          if(!dupl){
              contentItems.push(item1);
          }
      });
      place.contentItems = contentItems;
      place.links = [];
      place.links.push({'text':response.items[0].name['de'] , 'url': 'https://ethorama.library.ethz.ch/de/orte/' + response.items[0].id});
      // more than 1 POI -> add contentItems and links from other pois
      if(response.items.length > 1){
          for (var i = 1; i < response.items.length; i++) {
              response.items[i].contentItems.forEach((item1:any) => {
                  let dupl = false;
                  place.contentItems.forEach((item2:any) => {
                      if(item2.docId === item1.docId){
                          dupl = true;
                      }
                  })
                  if(!dupl){
                      place.contentItems.push(item1);
                  }
              });
              // 990043586820205503
              place.links.push({'text':response.items[i].name['de'], 'url': 'https://ethorama.library.ethz.ch/de/orte/' + response.items[i].id});
          }
      }
      return place; 
  }

  processGeoTopics(response: any){
    if(!response || !response.features || response.features.length === 0){
        return null;
    }
    let topics: any[] = [];
    response.features.forEach( (f:any) => {
        let eMaps:any = [];
        f.properties.eMaps.forEach((i:any) => {
            eMaps.push({
                'mmsid': i.mmsid,
                'url': '/discovery/fulldisplay?vid=' + this.vid + '&docid=alma' + i.mmsid,
                'title': i.title
            });
        });
        let eRaraItems:any = [];
        f.properties.eRaraItems.forEach((i:any) => {
            eRaraItems.push({
                'mmsid': i.mmsid,
                'url': '/nde/fulldisplay?vid=' + this.vid + '&docid=alma' + i.mmsid,
                'title': i.title
            });
        });
        topics.push({
            'name': f.properties.name,
            'url': '/nde/search?mode=advanced&vid=' + this.vid + '&query=sub,exact,' + encodeURIComponent(f.properties.name),
            'gnd': f.properties.gnd,
            'eRaraItems': eRaraItems,
            'eMaps': eMaps
        });
    })
    return topics; 
  }

  processGeoPoi(response: any){
    if(!response || !response.features || response.features.length === 0){
        return null;
    }
    let poi: any = {};
    poi.dossiers = [];
    poi.routes = [];
    // todo deduplicate routes, Dossiers
    response.features.forEach( (j:any) => {
      j.properties.dossiers.forEach( (i:any) => {
          if(this.lang == 'en'){
              let text = i.title_en;
              if(!text || text === '')text = i.title_de;
              poi.dossiers.push({
                  'url': 'https://ethorama.library.ethz.ch/en/topics/' + i.id,
                  'text': text
              })
          }
          else{
              poi.dossiers.push({
                  'url': 'https://ethorama.library.ethz.ch/de/themen/' + i.id,
                  'text': i.title_de
              })
          }
      })
      j.properties.routes.forEach( (i:any) => {
          if(this.lang == 'en'){
              let text = i.title_en;
              if(!text || text === '')text = i.title_de;
              poi.routes.push({
                  'url': 'https://ethorama.library.ethz.ch/en/routes/' + i.id,
                  'text': text
              })
          }
          else{
              poi.routes.push({
                  'url': 'https://ethorama.library.ethz.ch/de/reisen/' + i.id,
                  'text': i.title_de
              })
          }
      })
    })      
    return poi; 
  }

  processWikidata(response: any){
      if (!response?.results?.bindings?.length) {
        return null;
      }
      let place = response.results.bindings[0];
      place.name = response.results.bindings[0].itemLabel.value;
      place.description = response.results.bindings[0].itemDescription.value;
      place.image = response.results.bindings[0].image.value;

      place.links = [];

      if(place.item && place.item.value){
        place.links.push({
          text: 'Wikidata',
          url: place.item.value
        });
      }
      if(place.geonames){
        place.links.push({
          text: 'Geonames',
          url: 'https://www.geonames.org/' + place.geonames.value
        });
      }
      if(place.wikipedia){
        place.links.push({
          text: 'Wikipedia',
          url: place.wikipedia.value
        });
      }
      if(place.gnd){
          place.gnd = place.gnd.value;
        place.links.push({
          text: 'GND',
          url: 'http://d-nb.info/gnd/' + place.gnd.value
        });
      }
      if(place.hls){
        place.links.push({
          text: 'HLS',
          url: 'http://www.hls-dhs-dss.ch/textes/d/D' + place.hls.value + '.php'
        });
      }
      if(place.archinform){
        place.links.push({
          text: 'Archinform',
          url: 'https://www.archinform.net/ort/' + place.archinform.value +'.htm'
        });
      }
      return place; 
  }

}




