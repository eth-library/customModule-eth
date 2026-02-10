// EntityPage Place
// https://jira.ethz.ch/browse/SLSP-1991
import { Component, ElementRef, inject, ViewChild, ViewEncapsulation } from '@angular/core';
import { combineLatest, defer, forkJoin, map, Observable, of, startWith, switchMap, catchError, filter } from 'rxjs';
import { EthStoreService } from 'src/app/services/eth-store.service';
import { EthLocationPageService } from './eth-location-page.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule } from '@angular/common';
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

  placePageData$: Observable<PlacePageViewModel | null> = defer(() => {
    if (!this.router.url.includes('/entity/location')) {
      return of(null);
    }

    this.vid = this.ethStoreService.getVid();

    return combineLatest([
      this.ethStoreService.linkedDataEntityId$,
      this.translate.onLangChange.pipe(
        startWith({ lang: this.translate.currentLang })
      )
    ]).pipe(
      map(([entityId, langEvent]) => {
        this.lang = langEvent.lang;
        return entityId;
      }),
      filter(Boolean),
      switchMap(entityId => this.resolveEntityId(entityId)),
      switchMap(identifier => this.getLocationData(identifier)),
      catchError(e => {
        this.ethErrorHandlingService.logError(
          e,
          'EthLocationPageComponent.placePageData$'
        );
        return of(null);
      })
    );
  });
  
  qid: string = '';
  vid!: string | null;
  tab!: string | null;
  scope!: string | null;
  lang!: string;
  map!: any;
  polygonsWithCenters!: any;
  openWeight!: number;

  otbEntityStatus: Observable<string> = defer(() =>
    this.ethStoreService.linkedDataEntityStatus$.pipe(
      catchError(() => of('success'))
    )
  );

  openLicensePopover: string | null = null;  
  
  @ViewChild('licensePopover') licensePopover?: ElementRef;
  @ViewChild('licensePopoverTrigger') licensePopoverTrigger?: ElementRef;


  constructor(
    private translate: TranslateService,
    private ethStoreService: EthStoreService,
    public ethLocationPageService: EthLocationPageService,
    private ethErrorHandlingService: EthErrorHandlingService,
  ) {}

  // our services can use gnd and qid, but not lccn --> map lccn to qid
  // --> EthGeoRefComponent.buildLocationEntityUrl()
  private resolveEntityId(entityId: string): Observable<string> {
    // entityId=4639612-3,Q12345 - GND,QID Wikidata
    // entityId=Q12345 - Wikidata QID
    // entityId=GND4639612-3 GND
    if(entityId.includes(',') || entityId.startsWith('Q') || entityId.startsWith('GND')){
      return of(entityId)
    } 
    // entityId=no2002070963 lccn / LoC -> map lccn to qid
    return this.ethLocationPageService.getIdentifierForLccn(entityId).pipe(
      map(mapIdentifierResponseToQid),
      filter((qid): qid is string => !!qid)
    );
  }

  
  private getLocationData(identifier: string): Observable<PlacePageViewModel> {
    // check for type of identifier: gnd and qid, gnd, qid
    let qid;
    let gnd;
    
    // entityId=4639612-3,Q12345
    const parts = identifier.split(',');
    if (parts.length === 2) {
      [gnd, qid] = parts;
    }    
    // entityId=Q12345 - Wikidata QID
    else if (identifier.startsWith('Q')) {
      qid = identifier;
    }
    // entityId=GND4639612-3 GND
    else if(identifier.startsWith('GND')){
      gnd = identifier.slice(3);  
    }
    // Context
    const ctx: PlacePageContext = {
      lang: this.lang,
      vid: this.vid,
      tab: this.ethStoreService.getTab(),
      scope: this.ethStoreService.getScope()
    };

    return forkJoin({
      topics: qid || gnd ? this.ethLocationPageService.getTopicsFromGeoGraph(gnd, qid).pipe(catchError(() => of({ features: [] }))) : of({ features: [] }),
      poi: qid || gnd ? this.ethLocationPageService.getPoiFromGeoGraph(gnd, qid).pipe(catchError(() => of({ features: [] }))) : of({ features: [] }),
      ethorama: qid ? this.ethLocationPageService.getPlaceFromETHorama(qid).pipe(catchError(() => of({ items: [] }))) : of({ items: [] }),
      wikidata: qid || gnd ? this.ethLocationPageService.getPlaceFromWikidata(gnd, qid, this.lang).pipe(catchError(() => of({ results: { bindings: [] } }))) : of({ results: { bindings: [] } })
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

  open(key: string) {
    this.openLicensePopover = key;
    setTimeout(() => {
      this.licensePopover?.nativeElement?.focus();
    });
  }

  close() {
    this.openLicensePopover = null;
    setTimeout(() => {
      this.licensePopoverTrigger?.nativeElement?.focus();
    });
  }

  toggle(key: string) {
    this.isOpen(key) ? this.close() : this.open(key);
  }

  isOpen(key: string): boolean {
    return this.openLicensePopover === key;
  }        

  onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget as HTMLElement | null;
    console.error(next)
    if (!this.licensePopover?.nativeElement.contains(next)) {
      this.close();
    }
  }

}

