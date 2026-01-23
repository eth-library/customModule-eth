// EntityPage Place
// https://jira.ethz.ch/browse/SLSP-1991
import { Component, Inject, inject, Renderer2, ViewEncapsulation } from '@angular/core';
import { combineLatest, forkJoin, map, Observable, of, startWith, switchMap, catchError, filter, tap } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthLocationPageService } from './eth-location-page.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import * as L from 'leaflet';
import { PlacePageViewModel, PlacePageRawData, PlacePageContext} from '../models/eth.model';
import { mapETHorama, mapGeoTopics, mapGeoPoi, mapWikidata, mapMaps, mapIdentifierResponseToQid } from './eth-location-page.mapper';
import { SHELL_ROUTER } from "../injection-tokens";

@Component({
  selector: 'custom-eth-location-page',
  templateUrl: './eth-location-page.component.html',
  styleUrls: ['./eth-location-page.component.scss', '../../../node_modules/leaflet/dist/leaflet.css'],
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  imports: [CommonModule, MatDividerModule, MatExpansionModule, MatIconModule, SafeTranslatePipe]
})
export class EthLocationPageComponent {
  private router = inject(SHELL_ROUTER); 
  placePageData$!: Observable<PlacePageViewModel | null>;
  qid: string = '';
  vid!: string | null;
  tab!: string | null;
  scope!: string | null;
  lang!: string;
  map!: any;
  polygonsWithCenters!: any;
  openWeight!: number;
  otbEntityStatus!:  Observable<string>;
  openCommonsHint: string | null = null;  

  constructor(
    private translate: TranslateService,
    private ethStoreService: EthStoreService,
    public ethLocationPageService: EthLocationPageService,
    private renderer: Renderer2,
    private ethErrorHandlingService: EthErrorHandlingService,
    @Inject(DOCUMENT) private document: Document
  ) {}


  ngOnInit(): void {
    if (!this.router.url.includes('/entity/location')) {
      return;
    }
    
    // check in template if image/name/desc should be rendered
    this.otbEntityStatus = this.ethStoreService.linkedDataEntityStatus$.pipe(catchError(() => of('success')));
    
    this.vid = this.ethStoreService.getVid();

    this.placePageData$ = combineLatest([
      this.ethStoreService.linkedDataEntityId$,
      this.translate.onLangChange.pipe(
        startWith({ lang: this.translate.currentLang })
      )
    ]).pipe(map(([entityId, langEvent]) => {
        this.lang = langEvent.lang;
        return entityId;
      }),
      filter(Boolean),
      switchMap(entityId => this.resolveQid(entityId)),
      switchMap(qid => this.getLocationData(qid)),
      catchError(e => {
        this.ethErrorHandlingService.logError(
          e,
          'EthLocationPageComponent.ngOnInit'
        );
        return of(null);
      })
    );
  }

  private resolveQid(entityId: string): Observable<string> {
    if (entityId.startsWith('Q')) {
      return of(entityId);
    }

    return this.ethLocationPageService.getIdentifierForLccn(entityId).pipe(
      map(mapIdentifierResponseToQid),
      filter((qid): qid is string => !!qid)
    );
  }

  
  private getLocationData(qid: string): Observable<PlacePageViewModel> {
    // Context
    const ctx: PlacePageContext = {
      qid: this.qid,
      lang: this.lang,
      vid: this.vid,
      tab: this.ethStoreService.getTab(),
      scope: this.ethStoreService.getScope()
    };

    return forkJoin({
      topics: this.ethLocationPageService.getTopicsFromGeoGraph(qid).pipe(catchError(() => of({ features: [] }))),
      poi: this.ethLocationPageService.getPoiFromGeoGraph(qid).pipe(catchError(() => of({ features: [] }))),
      ethorama: this.ethLocationPageService.getPlaceFromETHorama(qid).pipe(catchError(() => of({ items: [] }))),
      wikidata: this.ethLocationPageService.getPlaceFromWikidata(qid, this.lang).pipe(catchError(() => of({ results: { bindings: [] } })))
    }).pipe(
      map((rawData: PlacePageRawData) => {
        const viewModelData: PlacePageViewModel = {
          topics: mapGeoTopics(rawData.topics, ctx),
          poi: mapGeoPoi(rawData.poi, ctx),
          ethorama: mapETHorama(rawData.ethorama, ctx),
          wikidata: mapWikidata(rawData.wikidata),
          maps: []
        };
        //console.error("viewModelData",viewModelData)
        return viewModelData;
      }),
      switchMap((vm: PlacePageViewModel) => {
        const coord = vm.wikidata?.coordinates;
        if (!coord) return of(vm);

        const lng = coord.substring(6, coord.indexOf(' '));
        const lat = coord.substring(coord.indexOf(' ') + 1, coord.length - 1);

        return this.ethLocationPageService.getMapsFromGeoGraph(lat, lng).pipe(
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
    this.router.navigateByUrl(url);
  }      

  open(id: string) {
    this.openCommonsHint = id;
  }
  close() {
    this.openCommonsHint = null;
  }
  isOpen(id: string): boolean {
    return this.openCommonsHint === id;
  }        

}

