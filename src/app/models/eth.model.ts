import { Geometry } from 'geojson';
import { Observable } from 'rxjs';

/* Primo delivery from store*/
export interface StoreDeliveryEntity {
  delivery?: {
    electronicServices?: StoreElectronicService[];
    availability?: string[];
  };
}
export interface StoreElectronicService {
  serviceUrl: string;
}


/* Primo HostComponent */
export interface HostComponent {
  location?: HostComponentLocation;
  searchResult?: Doc;
  expanded?: boolean;
  isOpen?: boolean;
  filtersVisible?: boolean;
  filterGroup?: HostComponentFilterGroup;
  filterList$?: any; 
  _service?: HostComponentService;
  viewModel$?: Observable<HostComponentViewModel>;
}
export interface HostComponentService {
  type?: string;
}
export interface HostComponentViewModel {
  onlineLinks?: unknown[];
}
export interface HostComponentLocation {
  libraryCode?: string;
  subLocationCode?: string;
  mainLocation?: string;
  ilsApiId?: string;
}
export interface HostComponentFilterGroup {
  id?: string;
}


/* Primo pnx */
export interface PrimoApiResponse  {
  docs?: Doc[];
}
export interface Doc  {
  pnx?: {
    display?: {
      identifier?: string[];
      title?: string[];
      creator?: string[];
      ispartof?: string[];
      creationdate?: string[];
      publisher?: string[];
      lds02?: string[];      
      lds03?: string[];
      lds09?: string[];
      source?: string[];
      lds50?: string[];
      lds90?: string[];
      type?: string[];
      mms?: string[];
    };
    addata?: {
      doi?: string[];
      openaccess?: string[];
      atitle?: string[];
      btitle?: string[];      
      jtitle?: string[];
      au?: string[];
      addau?: string[];
      volume?: string[];
      pages?: string[];
      issn?: string[];
      isbn?: string[];
      eisbn?: string[];            
      date?: string[];
    };
    links?: {
      linktorsrcadditional?: string[];
    };
    control?: {
      sourcerecordid:   string[];
      recordid:         string[];
      sourceid:         string[] | string;
      originalsourceid: string[];
      sourcesystem:     Sourcesystem[];
      sourceformat:     Sourceformat[];
      score:            Array<number | string>;
      isDedup?:         boolean;
      save_score?:      number[];
      recordtype?:      string[];
      sourcetype?:      string[];
      pqid?:            string[];
      addsrcrecordid?:  string[];
      jstorid?:         string[];
      galeid?:          string[];
      attribute?:       string[];
    };    
  }
}
export enum Sourceformat {
  Marc21 = "MARC21",
  XML = "XML",
}

export enum Sourcesystem {
  Ils = "ILS",
  Other = "Other",
}


/* eth-bib-news: AEM news API */
export interface NewsFeedAPIResponse {
  id: string;
  updated: string;
  title: string;
  link: string;
  appjson: string;
  entries: NewsEntry[];
}
export interface NewsEntry {
  id: string;
  title: string;
  author: string;
  link: string;
  appjson: string;
  image?: string;
  tags: string[];
  lead: string;
  updated: string;
  published: string;
  commentCount: number;
}
export interface NewsFeedVM {
  id: string;
  updated: string;
  title: string;
  link: string;
  appjson: string;
  entries: NewsEntry[];
}


/* eth-connected-papers: Connected Papers API */
export interface ConnectedPapersAPIResponse {
  id: string;
  citationCount?: number;
  referenceCount?: number;
}


/* eth-git-hint: Hint from Git repository API */
export interface GitHintAPIResponse {
  de: string; 
  en: string;
};
export type GitHintVM = string;


/* eth-provenienz-erara-link: Provenances from E-Pics API */
export interface EthProvenienzAPIResponse {
  items: EthProvenienzAPIItem[];
}
export interface EthProvenienzAPIItem {
  id: string;
  eth_doi_link: string;
  eth_license: string;
  eth_link_to_the_digital_version_in_e_rara: string;
  eth_copyright_notice: string;
  eth_dating: string;
  description: string;
  url: string;
  title: string;
}


/* online button: links */
export interface OnlineButtonLinkVM {
  url: string;
  source: string;
}


/* GeoJSON - Geodata Graph API */
/* generic type */
export interface GeoFeatureCollection<TProps = unknown> {
  type?: 'FeatureCollection';
  features?: GeoFeature<TProps>[];
}

export interface GeoFeature<TProps = unknown> {
  type?: 'Feature';
  geometry?: Geometry;
  properties?: TProps;
}
/* Geodata Graph API response for mmsid (georef/place card) */
export type GraphRelatedPlacesResponse = GeoFeatureCollection<GraphRelatedPlaces>;

/* Geodata Graph API response (place page) */
export type GraphGeoInfoResponse = GeoFeatureCollection<GraphGeoInfo>;

/* places from Graph API for mmsid (georef/place card)*/
export interface GraphRelatedPlaces {
  places?: GraphGeoInfo[];
}
/* Graph geo informations */
export interface GraphGeoInfo {
  name: string;
  gnd?: string;
  qid?: string;
  description?: string;
  image?: string;
  eMaps?: GraphPlaceEdgeRef[];
  eRaraItems?: GraphPlaceEdgeRef[];  
  dossiers?: GraphPlaceEthoramaRef[];
  routes?: GraphPlaceEthoramaRef[];  
  title?: string;
  attribution?: string;
  url?: string;
  scale?: string;
  source?: 'e-maps' | 'e-rara' | string;  
}
export interface GraphPlaceEdgeRef {
  mmsid: string;
  title: string;
}
export interface GraphPlaceEthoramaRef {
  id: string;
  title_de?: string;
  title_en?: string;
}

/* ETHorama single poi from Graph API */
export type GraphSinglePoiResponse = GeoFeatureCollection<GraphPoiProperties>;

export interface GraphPoiProperties {
  qid?: string;
  descriptionWikidata?: string;
  name_de?: string;
}

export interface EnrichedSinglePoiResponseGraph {
  id: string;
  thumbnail?: string;
  qid?: string;
  name?: string;
  descriptionWikidata?: string;
}

/* Pois from ETHorama API */
export interface EthoramaResponse {
  items?: EthoramaPoi[];
}
export interface EthoramaPoi {
  id: string;
  thumbnail?: string;
  name?: {
    de?: string;
    en?: string;
  };
  contentItems?: EthoramaContentItem[];  
  references?: {
    wikipedia?: {
      de?: string;
      en?: string;
    };
  };
}
export interface EthoramaContentItem {
  docId: string;
  [key: string]: any;
}

/* Places from wikidata API for place page */
export interface WikidataPlaceResponse {
  results?: {
    bindings?: WikidataBinding[];
  };
}
export interface WikidataBinding {
  item?: WikidataValue;
  itemLabel?: WikidataValue;
  itemDescription?: WikidataValue;
  image?: WikidataValue;
  wikipedia?: WikidataValue;
  geonames?: WikidataValue;
  gnd?: WikidataValue;
  hls?: WikidataValue;
  archinform?: WikidataValue;
  coordinate_location?: WikidataValue;
}
export interface WikidataValue {
  value: string;
  type?: string;
}

/* Places VM for georeference / place cards */
export interface PlacesGeoRefVM {
  ethorama: PlaceGeoRefVM[];
  emapsPlaces: PlaceGeoRefVM[];
  eraraPlaces: PlaceGeoRefVM[];
  allPlaces: PlaceGeoRefVM[];
}
export interface PlaceGeoRefVM {
  id?: string;
  qid: string;
  label: string;
  description?: string;
  thumbnail?: string;
  url: string;
}

/* PlacePage raw data from APIs */
export interface PlacePageRawData {
  topics: GraphGeoInfoResponse;
  poi: GraphGeoInfoResponse;
  ethorama: EthoramaResponse;
  wikidata: WikidataPlaceResponse;
}

/* PlacePage ViewModel */
export interface WikidataPlaceVM {
  name: string;
  description?: string;
  image?: string | null;
  coordinates?: string; 
  links: Array<{
    text: string;
    url: string;
  }>;
  coordinate_location?: WikidataValue;
}
export interface GeoTopicVM {
  name: string;
  gnd?: string;
  url?: string;
  eMaps?: Array<{ title: string; url: string }>;
  eRaraItems?: Array<{ title: string; url: string }>;
}
export interface GeoPoiVM {
  dossiers: Array<{ text: string; url: string }>;
  routes: Array<{ text: string; url: string }>;
}
export interface EthoramaPlaceVM {
  qid: string;
  contentItems: any[]; 
  links: Array<{ text: string; url: string }>;
}
export interface MapVM {
  title: string;
  description?: string;
  url?: string | null;
}
export interface PlacePageViewModel {
  topics?: GeoTopicVM[] | null;
  poi?: GeoPoiVM | null;
  ethorama?: EthoramaPlaceVM | null;
  wikidata?: WikidataPlaceVM | null;
  maps?: MapVM[] | null;
}

/* Context */
export interface PlacePageContext {
  qid: string;
  lang: string;
  vid: string | null;
  tab: string | null;
  scope: string | null;
}


/* eth-provenienz-erara-link: provenance - e-rara */
export interface ProvenanceEraraLinksVM {
   erara: string | null;
   swisscovery: string | null
};


/* eth-dnb-toc: dnb toc links */
export interface DnbTocApiResponse {
  identifier: string;
  links: DnbTocApiItem[]; 
}
export interface DnbTocApiItem {
  format?: string;
  title?: string;
  partOfResource?: string;
  uri?: string 
}
export interface DnbTocLinksVM {
  almaLinks: DnbTocAlmaLinkVM[];
  dnbLinks: DnbTocDnbLinkVM[];
};
export interface DnbTocAlmaLinkVM {
  identifier?: string | null;
  uri: string;
  type?: string | null;
  label: string;    
}
export interface DnbTocDnbLinkVM {
  uri: string;
  label: string;    
  identifier?: string | null;  
  type?: string | null;
  title?: string | null;
}


/* eth-compose-nb: compose TMA Nachlassbibliothek */
export interface NbPrintApiResponse {
  map?: {
    almaSearch?: string;
  }[];
}
export interface ComposeNbLinkVM {
  url: string;
  sortKey: string;
  label$: Observable<string>;
}


/* eth-compose-erara: compose e-rara and e-maps links */
export type EraraEMapsMapAPIResponse = EraraEMapsMapAPIItem[];
export interface EraraEMapsMapAPIItem {
  keys: string[];
  length: number;
  _fields: string[];
  _fieldLookup: Record<string, number>;
}
export interface ComposeEraraLinkVM {
  url: string;
  label$: Observable<string>;
  external: boolean;
}
