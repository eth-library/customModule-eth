import { Component, inject, Renderer2, ViewEncapsulation } from '@angular/core';
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
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import * as L from 'leaflet';
import { SHELL_ROUTER } from "../injection-tokens";


@Component({
  selector: 'custom-eth-place-page',
  templateUrl: './eth-place-page.component.html',
  styleUrls: ['./eth-place-page.component.scss',
    '../../../node_modules/leaflet/dist/leaflet.css'],
  standalone: true,   
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    MatDividerModule,
    MatExpansionModule,
    MatIconModule,
    SafeTranslatePipe    
  ]    
})
export class EthPlacePageComponent {
  private router = inject(SHELL_ROUTER);   

  placeData$!: Observable<any>;
  qid: string = '';
  vid!: string|null;
  tab!: string|null;
  scope!: string|null;
  lang!: string
  searchValue$!: Observable<string>;
  map!: any;
  polygonsWithCenters!: any;
  openWeight!: number;

  constructor(
    private translate: TranslateService,
    private ethStoreService:EthStoreService,
    public ethPlacePageService: EthPlacePageService,
    private renderer: Renderer2,
    private ethErrorHandlingService: EthErrorHandlingService
  ){}  

  ngOnInit(): void {
    this.searchValue$ = this.ethStoreService.searchValue$;
    this.placeData$ = this.searchValue$.pipe(
      switchMap((searchValue: string) => {
        return this.initPlacePage(searchValue);
      }),
      //tap(val => console.error(val))
    )
  }  

  initPlacePage(searchValue: string): Observable<any | null> {
    this.lang = this.translate.currentLang;
    this.vid = this.ethStoreService.getVid();
    this.tab = this.ethStoreService.getTab();
    this.scope = this.ethStoreService.getScope();
    if(searchValue && searchValue.includes('[wd/place]')){
      this.qid = searchValue.substring(searchValue.indexOf(']') + 1);
    }
    if(this.qid === '') {
      return of(null);
    }
    // hide search result container
    const observer = new MutationObserver(() => {
      const target = document.querySelector('.search-result-content');
      if (target) {
        this.renderer.setStyle(target, 'display', 'none');
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });        

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
      switchMap( (data:any) => {
        let point = data.wikidata.coordinate_location?.value || null;
        let lng = point?.substring(6,point.indexOf(' '))  || null;
        let lat = point?.substring(point.indexOf(' ') + 1, point.length-1)  || null;        
        if (lat && lng) {
          return this.ethPlacePageService.getMapsFromGeoGraph(lat, lng).pipe(
            catchError((e) => {
              return of(null)
            }),
            map(mapsData => {
              if (!mapsData) {
                return { ...data, maps: null };
              }
              let filteredFeatures = mapsData.features?.filter((f:any) => {
                const scale = f.properties?.scale;
                return scale && parseInt(scale, 10) <= 50000;
              }) || [];
              //console.error(filteredFeatures)
              try {
                filteredFeatures = filteredFeatures.sort((a:any, b:any) =>
                  a.properties.title.localeCompare(b.properties.title, 'de', { ignorePunctuation: true })
                );
              } catch (e) {
                filteredFeatures = filteredFeatures.sort((a:any, b:any) =>
                  a.properties.title.localeCompare(b.properties.title)
                );
              }
              
              setTimeout(() => this.initMap(filteredFeatures, lat, lng))

              const maps = filteredFeatures.map( (f:any) => {
                let title = f.properties.title;
                if (f.properties.attribution){
                  title += ' ,' + f.properties.attribution;                  
                }
                if (f.properties?.source === 'e-maps'){
                    title += ' ' +  '(e-maps, georeferenced)';
                }
                else if(f.properties?.source === 'e-rara'){
                    title += ' ' +  '(e-rara)';
                }
                let url = null;
                if(f.properties.url){
                  url = f.properties.url;
                  url = url.replace('http://', '');
                  if(url.indexOf('https://') === -1){
                      url = 'https://' + url;
                  }
                }
                return {
                  'url': url,
                  'title': title,
                  'description':f.properties.description                  
                }
              })              
              return {
                ...data,
                maps: maps
              };
            })
          )
        }
        else {
          return of({ ...data, maps: null });          
        }        
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
            'url': '/search?mode=advanced&vid=' + this.vid + '&tab=' + this.tab + '&search_scope=' + this.scope + '&query=sub,exact,' + encodeURIComponent(f.properties.name),
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
      place.image = response.results.bindings[0].image?.value || null;

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
          url: 'http://d-nb.info/gnd/' + place.gnd
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

  initMap(filteredFeatures:any, lat: any, lng: any): void {
    let opacity = 0.03;
    this.openWeight = 4;
    if(filteredFeatures.length > 10){
        opacity = 0;
        this.openWeight = 6;
    }
    // initialize Map
    if (this.map) {
      this.map.remove(); 
    }
    if(!document.getElementById('mapid')){
      return;
    }
    this.map = L.map('mapid', {
      center: L.latLng(lat,lng),
      zoom: 10
    });
    
    // basic layer
    var openStreetLayer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/map-feedback/">Mapbox</a>',
      tileSize: 512,
      maxZoom: 18,
      zoomOffset: -1,
    });
    openStreetLayer.addTo(this.map);    

    // marker for place
    var placeIcon = L.icon({
      iconUrl: "custom/" + this.vid?.replace(':','-') + "/assets/images/marker.png",
      iconSize: [25, 41],
    });
    L.marker([lat, lng],{alt:'Place', icon: placeIcon}).addTo(this.map);    

    // prepare layer group for polygons
    this.polygonsWithCenters = L.layerGroup();
    
    // add geoJson features
    const geoJsonLayer = L.geoJSON(filteredFeatures, {
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
      style: {
        color: "#356947",
        weight: 1,
        fillOpacity: opacity
      }
    });

    this.polygonsWithCenters.addLayer(geoJsonLayer);
    this.polygonsWithCenters.addTo(this.map);
  }

  onEachFeature(feature:any, layer:any){
      // marker
      let center = layer.getBounds().getCenter();
      //iconUrl: "custom/MOCKINST-MOCKVID/assets/images/map.png", 
      //iconUrl: "custom/41SLSP_ETH-ETH_CUSTOMIZING/assets/images/map.png",
      let mapIcon = L.icon({
        iconUrl: "custom/" + this.vid?.replace(':','-') + "/assets/images/map.png",   
        iconSize: [25, 25],
      });
      
      let markerOptions = {
          clickable: true,
          color: "#356947",
          alt: 'Marker ' + feature.properties.title,
          icon: mapIcon
      }
      let marker = L.marker(center, markerOptions);
      // popup content
      let popupContent = '<div class="eth-map-info">';
      popupContent += '<div class="eth-map-info-title">' + feature.properties.title + '</div>';
      if(feature.properties.attribution){
          popupContent += '<div class="eth-map-info-text">' + feature.properties.attribution + '</div>';
      }
      popupContent += '<div class="eth-map-info-hint">Please click on the marker to see details of this map.</div>';
      popupContent += '</div>';
      marker.bindPopup(popupContent);
      // marker events
      marker.on('mouseover', (e: any) => {
        marker.openPopup();
        layer.setStyle({ weight: this.openWeight });
      });
      // touch: long press (1sec)
      marker.on('contextmenu', (e: any) => {
        marker.openPopup();
        layer.setStyle({ weight: this.openWeight });
      });
      marker.on('mouseout', (e: any) => {
        marker.closePopup();
        layer.setStyle({ weight: 1});
      });
      marker.on('click', (e: any) => {
        let url = feature.properties.url;
        if(url.indexOf('10.3931/e-rara') > -1 && url.indexOf('dx.doi.org') === -1){
            url = 'https://dx.doi.org/' + url;
        }
        window.open(url, "_blank");
      });
      // add marker to layerGroup
      let polygonAndItsCenter = L.layerGroup([layer, marker]);
      polygonAndItsCenter.addTo(this.polygonsWithCenters);
  }

    navigate(url: string, event: Event){
      event.preventDefault();  
      this.router.navigateByUrl(url);
    }      
}




