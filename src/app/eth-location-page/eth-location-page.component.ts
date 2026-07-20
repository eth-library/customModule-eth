// EntityPage Place

// https://jira.ethz.ch/browse/SLSP-1991
import { Component, ElementRef, inject, ViewChild, ViewEncapsulation, DestroyRef } from '@angular/core';
import { combineLatest, defer, forkJoin, map, Observable, of, startWith, switchMap, catchError, filter } from 'rxjs';
import { EthStoreService } from '../services/eth-store.service';
import { EthLocationPageService } from './eth-location-page.service';
import { TranslateService } from '@ngx-translate/core';
import { EthErrorHandlingService } from '../services/eth-error-handling.service';
import { CommonModule, DOCUMENT } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { SafeTranslatePipe } from '../pipes/safe-translate.pipe';
import * as L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import { PlacePageViewModel, PlacePageRawData, PlacePageContext, GeoJSONFeature, GraphGeoInfo } from '../models/eth.model';
import { mapETHorama, mapGeoTopics, mapGeoPoi, mapWikidata, mapMaps, mapIdentifierResponseToQid } from './eth-location-page.mapper';
import { SHELL_ROUTER } from "../injection-tokens";

type MapFeature = GeoJSONFeature<GraphGeoInfo>;
type StyledBoundsLayer = L.Layer & {
  getBounds: () => L.LatLngBounds;
  setStyle: (style: { weight: number }) => void;
};

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
  private destroyRef = inject(DestroyRef);
  private document = inject(DOCUMENT);
  private translate = inject(TranslateService);
  private ethStoreService = inject(EthStoreService);
  public ethLocationPageService = inject(EthLocationPageService);
  private ethErrorHandlingService = inject(EthErrorHandlingService);
  private pendingTimeouts = new Set<ReturnType<typeof setTimeout>>();

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
  map: L.Map | null = null;
  polygonsWithCenters: L.LayerGroup | null = null;
  openWeight!: number;

  otbEntityStatus: Observable<string> = defer(() =>
    this.ethStoreService.linkedDataEntityStatus$.pipe(
      catchError(() => of('success'))
    )
  );

  openLicensePopover: string | null = null;  
  
  @ViewChild('licensePopover') licensePopover?: ElementRef;
  @ViewChild('licensePopoverTrigger') licensePopoverTrigger?: ElementRef;
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.clearPendingTimeouts();
      this.destroyMap();
    });
  }

  private scheduleTask(task: () => void, delay = 0): void {
    const timeoutId = globalThis.setTimeout(() => {
      this.pendingTimeouts.delete(timeoutId);
      task();
    }, delay);
    this.pendingTimeouts.add(timeoutId);
  }

  private clearPendingTimeouts(): void {
    this.pendingTimeouts.forEach(timeoutId => globalThis.clearTimeout(timeoutId));
    this.pendingTimeouts.clear();
  }

  private destroyMap(): void {
    this.map?.remove();
    this.map = null;
    this.polygonsWithCenters = null;
  }

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
            let filteredFeatures = ((mapsData.features ?? []) as MapFeature[]).filter(f => {
              const scale = f.properties?.scale;
              return scale && parseInt(scale, 10) <= 50000;
            });
            //console.error("filteredFeatures",filteredFeatures)
            try {
              filteredFeatures = filteredFeatures.sort((a: MapFeature, b: MapFeature) =>
                (a.properties?.title ?? '').localeCompare(b.properties?.title ?? '', 'de', { ignorePunctuation: true })
              );
            } catch {
              filteredFeatures = filteredFeatures.sort((a: MapFeature, b: MapFeature) =>
                (a.properties?.title ?? '').localeCompare(b.properties?.title ?? '')
              );
            }
            this.scheduleTask(() => this.initMap(filteredFeatures, lat, lng));                        
            return { 
              ...vm, maps: mapMaps({features: filteredFeatures})
            };            
          })
        );
      })
    );
  }

  private initMap(features: MapFeature[], lat: string, lng: string) {
    let opacity = features.length > 10 ? 0 : 0.03;
    this.openWeight = features.length > 10 ? 6 : 4;

    if (this.map) this.map.remove();
    if (!this.document.getElementById('mapid')) return;

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

    const geoJsonLayer = L.geoJSON(features as unknown as GeoJsonObject[], {
      onEachFeature: (feature, layer) => this.onEachFeature(feature, layer),
      style: { color: '#356947', weight: 1, fillOpacity: opacity }
    });
    this.polygonsWithCenters.addLayer(geoJsonLayer);
    this.polygonsWithCenters.addTo(this.map);
  }


  private onEachFeature(feature: MapFeature, layer: L.Layer) {
    if (!this.polygonsWithCenters) {
      return;
    }
    const styledLayer = layer as StyledBoundsLayer;
    const center = styledLayer.getBounds().getCenter();
    const icon = L.icon({
      iconUrl: `custom/${this.vid?.replace(':', '-')}/assets/images/map.png`,
      iconSize: [25, 25]
    });
    const title = feature.properties?.title ?? '';
    const marker = L.marker(center, { icon, alt: title });
    marker.bindPopup(`<div>${title}</div>`);

    marker.on('mouseover', () => { marker.openPopup(); styledLayer.setStyle({ weight: this.openWeight }); });
    marker.on('mouseout', () => { marker.closePopup(); styledLayer.setStyle({ weight: 1 }); });
    marker.on('click', () => {
      const url = feature.properties?.url;
      if (url) {
        globalThis.open?.(url, '_blank');
      }
    });

    L.layerGroup([styledLayer, marker]).addTo(this.polygonsWithCenters);
  }

  
  navigate(url: string, event: Event){
    event.preventDefault();  
    this.router.navigateByUrl(url);
  }      

  open(key: string) {
    this.openLicensePopover = key;
    this.scheduleTask(() => {
      this.licensePopover?.nativeElement?.focus();
    });
  }

  close() {
    this.openLicensePopover = null;
    this.scheduleTask(() => {
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
    if (!this.licensePopover?.nativeElement.contains(next)) {
      this.close();
    }
  }

}

