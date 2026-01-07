// EntityPage Place
// https://jira.ethz.ch/browse/SLSP-1991
import { Component, Inject, inject, Renderer2, ViewEncapsulation } from '@angular/core';
import { combineLatest, forkJoin, map, Observable, of, startWith, switchMap, catchError } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthPlacePageService } from './eth-place-page.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import * as L from 'leaflet';
import { PlacePageViewModel, PlacePageRawData, PlacePageContext} from '../models/eth.model';
import { mapETHorama, mapGeoTopics, mapGeoPoi, mapWikidata, mapMaps } from './eth-place-page.mapper';

@Component({
  selector: 'custom-eth-place-page',
  templateUrl: './eth-place-page.component.html',
  styleUrls: ['./eth-place-page.component.scss', '../../../node_modules/leaflet/dist/leaflet.css'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDividerModule, MatExpansionModule, MatIconModule, SafeTranslatePipe]
})
export class EthPlacePageComponent {

  placePageData$!: Observable<PlacePageViewModel | null>;
  qid: string = '';
  vid!: string | null;
  tab!: string | null;
  scope!: string | null;
  lang!: string;
  map!: any;
  polygonsWithCenters!: any;
  openWeight!: number;

  constructor(
    private translate: TranslateService,
    private ethStoreService: EthStoreService,
    public ethPlacePageService: EthPlacePageService,
    private renderer: Renderer2,
    private ethErrorHandlingService: EthErrorHandlingService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.placePageData$ = combineLatest([
      this.ethStoreService.searchValue$,
      this.translate.onLangChange.pipe(startWith({ lang: this.translate.currentLang }))
    ]).pipe(
      switchMap(([searchValue, langEvent]) => {
        this.lang = langEvent.lang;
        return this.initPlacePage(searchValue);
      })
    );
  }

  private initPlacePage(searchValue: string): Observable<PlacePageViewModel | null> {
    if (!searchValue || !searchValue.includes('[wd/place]')) return of(null);
    this.qid = searchValue.split(']')[1] || '';
    if (!this.qid) return of(null);

    // Hide search results container (optional)
    const searchContent = this.document.querySelector('.search-content');
    if (searchContent) {
      const observer = new MutationObserver(() => {
        const target = searchContent.querySelector('.search-result-content');
        if (target) {
          this.renderer.setStyle(target, 'display', 'none');
          observer.disconnect();
        }
      });
      observer.observe(searchContent, { childList: true, subtree: true });
    }
    // Get place data
    return this.getPlaceData();
  }

  private getPlaceData(): Observable<PlacePageViewModel> {

    // Context
    const ctx: PlacePageContext = {
      qid: this.qid,
      lang: this.lang,
      vid: this.ethStoreService.getVid(),
      tab: this.ethStoreService.getTab(),
      scope: this.ethStoreService.getScope()
    };

    return forkJoin({
      topics: this.ethPlacePageService.getTopicsFromGeoGraph(this.qid).pipe(catchError(() => of({ features: [] }))),
      poi: this.ethPlacePageService.getPoiFromGeoGraph(this.qid).pipe(catchError(() => of({ features: [] }))),
      ethorama: this.ethPlacePageService.getPlaceFromETHorama(this.qid).pipe(catchError(() => of({ items: [] }))),
      wikidata: this.ethPlacePageService.getPlaceFromWikidata(this.qid, this.lang).pipe(catchError(() => of({ results: { bindings: [] } })))
    }).pipe(
      map((rawData: PlacePageRawData) => {
        const viewModelData: PlacePageViewModel = {
          topics: mapGeoTopics(rawData.topics, ctx),
          poi: mapGeoPoi(rawData.poi, ctx),
          ethorama: mapETHorama(rawData.ethorama, ctx),
          wikidata: mapWikidata(rawData.wikidata),
          maps: []
        };
        return viewModelData;
      }),
      switchMap((vm: PlacePageViewModel) => {
        const coord = vm.wikidata?.coordinates;
        if (!coord) return of(vm);

        const lng = coord.substring(6, coord.indexOf(' '));
        const lat = coord.substring(coord.indexOf(' ') + 1, coord.length - 1);

        return this.ethPlacePageService.getMapsFromGeoGraph(lat, lng).pipe(
          catchError(() => of({ features: [] })),
          map((mapsData) => {
            if (!mapsData) {
              return {
                ...vm, maps: [] 
              };
            }
            let filteredFeatures = (mapsData.features ?? []).filter(f => {
              const scale = f.properties?.scale;
              return scale && parseInt(scale, 10) <= 50000;
            });
            //console.error("filteredFeatures",filteredFeatures)
            try {
              filteredFeatures = filteredFeatures.sort((a:any, b:any) =>
                a.properties.title.localeCompare(b.properties.title, 'de', { ignorePunctuation: true })
              );
            } catch (e) {
              filteredFeatures = filteredFeatures.sort((a:any, b:any) =>
                a.properties.title.localeCompare(b.properties.title)
              );
            }
            setTimeout(() => this.initMap(filteredFeatures, lat, lng));                        
            return { 
              ...vm, maps: mapMaps({features: filteredFeatures})
            };            
          })
        );
      })
    );
  }

  private initMap(features: any[], lat: string, lng: string) {
    let opacity = features.length > 10 ? 0 : 0.03;
    this.openWeight = features.length > 10 ? 6 : 4;

    if (this.map) this.map.remove();
    if (!document.getElementById('mapid')) return;

    const latNum = Number(lat);
    const lngNum = Number(lng);    

    this.map = L.map('mapid', { center: L.latLng(latNum, lngNum), zoom: 10 });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      tileSize: 512,
      maxZoom: 18,
      zoomOffset: -1
    }).addTo(this.map);

    L.marker([latNum, lngNum], {
      icon: L.icon({
        iconUrl: `custom/${this.vid?.replace(':', '-')}/assets/images/marker.png`,
        iconSize: [25, 41]
      }),
      alt: 'Place'
    }).addTo(this.map);

    this.polygonsWithCenters = L.layerGroup();

    const geoJsonLayer = L.geoJSON(features, {
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
      style: { color: '#356947', weight: 1, fillOpacity: opacity }
    });

    this.polygonsWithCenters.addLayer(geoJsonLayer);
    this.polygonsWithCenters.addTo(this.map);
  }


  private onEachFeature(feature: any, layer: any) {
    const center = layer.getBounds().getCenter();
    const icon = L.icon({
      iconUrl: `custom/${this.vid?.replace(':', '-')}/assets/images/map.png`,
      iconSize: [25, 25]
    });
    const marker = L.marker(center, { icon, alt: feature.properties.title });
    marker.bindPopup(`<div>${feature.properties.title}</div>`);

    marker.on('mouseover', () => { marker.openPopup(); layer.setStyle({ weight: this.openWeight }); });
    marker.on('mouseout', () => { marker.closePopup(); layer.setStyle({ weight: 1 }); });
    marker.on('click', () => window.open(feature.properties.url, '_blank'));

    L.layerGroup([layer, marker]).addTo(this.polygonsWithCenters);
  }

  
  navigate(url: string, event: Event){
    event.preventDefault();  
    // todo change if entity page for place
    location.href = "/nde"+ url
    //this.router.navigateByUrl(url);
  }      

}

