import { Geometry } from 'geojson';
import { Observable } from 'rxjs';

/* common */
export interface WikidataValue {
  value: string;
  type?: string;
}


/* Primo delivery from store*/
export interface StoreDeliveryEntity {
  recordId?: string;
  delivery?: {
    recordOwner?: string;
    availabilityLinksUrl?: string[];
    electronicServices?: StoreElectronicService[];
    availability?: string[];
    link?: DeliveryLink[];
    deliveryCategory?: string[];    
  };
}
export interface StoreElectronicService {
  serviceUrl: string;
  ilsApiId: string;
}
interface DeliveryLink {
  linkURL?: string;
  displayLabel?: string;
  linkType?: string;
}


/* Primo HostComponent */
export interface HostComponent {
  location?: HostComponentLocation;
  searchResult?: PnxDoc;
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
  info?: {
    totalResultsLocal?: number;
  };
  docs?: PnxDoc[];
  records?: any[]; // todo
}
export interface PnxDoc  {
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
      sourceformat?:     Sourceformat[];
      score?:            Array<number | string>;
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

/* online button ViewModel */
export interface OnlineButtonVM {
  url: string;
  source: string;
}

/* GeoJSON - Geodata Graph API */
/* generic types */
export interface GeoJSONFeatureCollection<TProps = unknown> {
  type?: 'FeatureCollection';
  features?: GeoJSONFeature<TProps>[];
}

export interface GeoJSONFeature<TProps = unknown> {
  type?: 'Feature';
  geometry?: Geometry;
  properties?: TProps;
}
/* Geodata Graph API response for mmsid (georef/place card) */
export type GraphRelatedPlacesResponse = GeoJSONFeatureCollection<GraphRelatedPlaces>;

/* Geodata Graph API response (place page) */
export type GraphGeoInfoAPIResponse = GeoJSONFeatureCollection<GraphGeoInfo>;

/* ETHorama single poi from Graph API */
export type GraphSinglePoiAPIResponse = GeoJSONFeatureCollection<GraphPoiProperties>;

/* places from Graph API for mmsid (georef/place card)*/
export interface GraphGndPlacesResponse {
  results: GraphGeoInfo[];
}
/*  */
export interface GraphRelatedPlaces {
  places?: GraphGeoInfo[];
}
/* Graph geo informations */
export interface GraphGeoInfo {
  name: string;
  gnd?: string;
  qid?: string;
  lccn?: string;
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

export interface GraphPoiProperties {
  qid?: string;
  gnd?: string;
  lccn?: string;
  descriptionWikidata?: string;
  name_de?: string;
}

/* enriched POI */
export interface EnrichedPoiAPIResponse
{
  id: string;
  thumbnail?: string;
  qid?: string;
  gnd?: string;
  lccn?: string;
  name?: string;
  descriptionWikidata?: string;
}

/* Pois from ETHorama API */
export interface EthoramaAPIResponse {
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
export interface WikidataPlaceAPIResponse {
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

/* identifier for lccn from wikidata */
export interface WikiIdentifierForLccnAPIResponse {
  results: {
    bindings: {
      item: WikidataValue;
      lccn?: WikidataValue;
      gnd?: WikidataValue;
      qid: WikidataValue;
    }[];
  };
}

/* Places VM for georeference / place cards */
export interface PlacesGeoRefVM {
  gndPlacesLobid: PlaceGeoRefVM[]; 
  gndPlacesGraph: PlaceGeoRefVM[];
  ethorama: PlaceGeoRefVM[];
  allPlaces: PlaceGeoRefVM[];
}
export interface PlaceGeoRefVM {
  id?: string;
  qid: string | undefined;
  lccn?: string | undefined;
  gnd?: string | undefined;
  label: string;
  description?: string;
  thumbnail?: string;
  url?: string;
}

export interface GeoRefContext {
  lang: string;
  vid: string;
};

export interface GeoRefIds {
  gnd?: string;
  qid?: string;
  lccn?: string;
};

/* PlacePage raw data from APIs */
export interface PlacePageRawData {
  topics: GraphGeoInfoAPIResponse;
  poi: GraphGeoInfoAPIResponse;
  ethorama: EthoramaAPIResponse;
  wikidata: WikidataPlaceAPIResponse;
}

/* eth-place-page:  PlacePage ViewModel */
export interface WikidataPlaceVM {
  name: string;
  description?: string;
  image?: string | null;
  image_page?: string | null;
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
}
export interface GeoPoiVM {
  dossiers: Array<{ text: string; url: string }>;
  routes: Array<{ text: string; url: string }>;
}
export interface EthoramaPlaceVM {
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

/* eth-person-card: otb linked data recommendations */
export interface LinkedDataRecommendation {
    id: string;
    entityType: 'person' | string;
    details: Record<string, LinkedDataDetails>; // details per lang
    thumbnail?: LinkedDataThumbnail;
}
export interface LinkedDataDetails {
    name: string;
    pageTitle: string;
    description?: string;
    wikiUrl?: string;
    properties: LinkedDataProperty[];
}
export interface LinkedDataThumbnail {
    imageArtist?: string;
    imageName?: string;
    imagePageLink?: string;
    imageUrl?: string;
    licenseCode?: string;
    licenseText?: string;
    licenseUrl?: string;
}
export interface LinkedDataProperty {
    label: string;
    value: string;
}

/* person data */
export interface PersonApiResponse {
  gnd?: string[];
  results: PersonResult[];
  qid?: string[];
}
export interface PersonResult {
  provider: string;
  resp: any;  // provider specific
  gnd?: string;
}
export interface GndByIdRefApiResponse {
  gnd?: string;
  errorMessage?: string;
}

export interface WikiRelatedPersonApiResponse {
  results: {
    bindings: WikiRelatedPersonBinding[];
  } 
}
export interface WikiRelatedPersonBinding {
  item?: { value: string };
  itemLabel?: { value: string };
  gndId?: { value: string };
  image?: { value: string };
  itemDescription?: { value: string };
  teacherBirths?: { value: string };
  teacherDeaths?: { value: string };
  studentBirths?: { value: string };
  studentDeaths?: { value: string };
}
export interface WikiApiResponse {
  results: {
    bindings: WikiSparqlBinding[];
  };
}
interface WikiSparqlBinding {
  item?: WikidataValue;
  loc?: WikidataValue;
  itemLabel?: WikidataValue;
  itemDescription?: WikidataValue;
  image?: WikidataValue;
  birth?: WikidataValue;
  death?: WikidataValue;
  birthplaceLabel?: WikidataValue;
  deathplaceLabel?: WikidataValue;
  aliasList?: WikidataValue;
  wc?: WikidataValue;
  hls?: WikidataValue;
  orcid?: WikidataValue;
  scholar?: WikidataValue;
  scopus?: WikidataValue;
  researchgate?: WikidataValue;
  dimension?: WikidataValue;
  [key: string]: WikidataValue | undefined;
}


export interface WikiArchivesAtApiResponse {
  results: {
    bindings: {
      ref?: { value: string };
      archivedLabel?: WikidataValue;
      inventoryno?: WikidataValue;
    }[];
  };
}
export interface WikiUrlListApiResponse {
  results: {
     bindings: { wikipediaUrlList?: { value: string }}[] 
  } 
}
export type PrometheusApiResponse = [
  string,     // index 0 → GND-URI
  string[],   // index 1 → sources
  number[],   // index 2 → result count
  string[]    // index 3 → links  
];
export interface MetagridApiResponse {
  meta: MetagridMeta;
  concordances: MetagridConcordance[];
}
export interface MetagridMeta {
  limit: number;
  start: number;
  total: number;
  uri: string;
}
export interface MetagridConcordance {
  id: string;
  legacy_id: number;
  name: string;
  uri: string;
  resources: MetagridResource[];
}
export interface MetagridResource {
  _type: 'person' | string;
  identifier: string;
  provider: MetagridProvider;
  link: MetagridLink;
  concordance: MetagridResourceConcordance;
  [key: string]: unknown;
}
export interface MetagridProvider {
  uri: string;
  slug: string;
 [key: string]: unknown;
}
export interface MetagridLink {
  uri: string;
  label?: string;
  [key: string]: unknown;
}
export interface MetagridResourceConcordance {
  id: string;
  uri: string;
  [key: string]: unknown;
}

export interface EntityfactsApiResponse {
  '@type': string;
  preferredName?: string;
  biographicalOrHistoricalInformation?: string;
  professionOrOccupation?: {'@id': string, preferredName: string}[];
  dateOfBirth?: string;
  dateOfDeath?: string;
  depiction?: {'@id': string, thumbnail?:{'@id': string}; url: string; creator?: string; creditText?: string};
  familialRelationship: EntityfactsRelatedPersonApiResponse[];
  relatedPerson: EntityfactsRelatedPersonApiResponse[];
  placeOfActivity?: {'@id': string; preferredName?: string}[];
  placeOfBirth?: {'@id': string; preferredName?: string}[];
  sameAs?: {'@id': string; collection?: {abbr: string}}[];
}
export interface EntityfactsRelatedPersonApiResponse{
  '@id': string;
  relationship?: string;
  preferredName?: string;
}
export interface PersonVM {
  gnd: string;
  qid?: string;
  label?: string;                 
  name?: string;                 
  yearOfBirth?: string;
  birth?: string;                
  death?: string;                
  entityfacts?: EntityfactsVM;
  wiki?: WikiVM;
  prometheusLinks?: ExternalLinkVM[];
  metagridLinks?: MetagridLinksVM[];
  wikipediaUrl?: string;
  wikiArchivesAtLinks?: WikiArchivesAtLinksVM[];
  url: string;                  
  searchVariants?: SearchVariantVM[];
  teachers?: WikiRelatedPersonVM[];
  students?: WikiRelatedPersonVM[];
}
export interface EntityfactsVM {
  preferredName?: string;
  biography?: string;
  profession?: string;
  birthDate?: string;
  deathDate?: string;
  image?: {thumbnail?:{'@id': string}; url: string};
  relatedPersons: EntityfactsRelatedPersonVM[];
  placesOfActivity?: EntityfactsPlaceVM[];
  placesOfBirth?: EntityfactsPlaceVM[];
  lccn?: string;
  qid?: string;
}
export interface WikiRelatedPersonVM {
  gnd: string;
  qid?: string;  
  name: string;
  birth?: string;
  image_url?: string;
  description?: string;
}
export interface EntityfactsRelatedPersonVM {
  gnd: string;
  name: string;
  relationship?:string;
}
export interface ExternalLinkVM {
  url: string;
  label: string;
}
export interface WikiArchivesAtLinksVM {
  url: string;
  label: string;
  inventoryno?: string;          
}
export interface MetagridLinksVM {
  url: string;
  label: string;
  slug: string;                 
}
export interface SearchVariantVM {
  url: string;
  total: number;
}

export interface WikiVM {
  qid?: string;
  loc?: string;                   
  label?: string;                 
  description?: string;           
  image_url?: string;             
  birth?: string;                 
  death?: string;                 
  birthplace?: string;
  deathplace?: string;
  aVariants?: string[];           
  links?: ExternalLinkVM[];       
  profiles?: ExternalLinkVM[];    
}
export interface EntityfactsPlaceVM {
  gnd?: string;
  name: string;
}
export interface PersonCardVM {
  otbPersons: LinkedDataRecommendation[],
  filteredPersons: PersonVM[];  
}

/* lobid */
export interface LobidAPIResponse {
  totalItems: number;
  member: LobidGndMember[];
}
export interface LobidGndMember {
  '@context'?: string;
  id: string;
  gndIdentifier: string;
  preferredName: string;
  type: string[];

  geographicAreaCode?: LobidIdLabel[];
  broaderTermPartitive?: LobidIdLabel[];
  relatedDdcWithDegreeOfDeterminacy2?: LobidIdLabel[];
  relatedDdcWithDegreeOfDeterminacy4?: LobidIdLabel[];

  hasGeometry?: LobidGeometry[];
  deprecatedUri?: string[];

  biographicalOrHistoricalInformation?: string[];
  variantName?: string[];
  wikipedia?: LobidIdLabel[];
  homepage?: LobidIdLabel[];

  oldAuthorityNumber?: string[];

  describedBy?: LobidDescribedBy;
  sameAs?: LobidSameAs[];
  depiction?: LobidDepiction[];
}
export interface LobidIdLabel {
  id: string;
  label?: string;
}
export interface LobidGeometry {
  type: string;
  asWKT: string[];
}
export interface LobidDescribedBy {
  id: string;
  dateModified: string;
  descriptionLevel: LobidIdLabel;
  dctCreator: LobidIdLabel;
  maintainer: LobidIdLabel;
  license: LobidIdLabel;
}
export interface LobidSameAs {
  id: string;
  collection?: {
    id: string;
    name: string;
    abbr?: string;
    publisher?: string;
    icon?: string;
  };
}
export interface LobidDepiction {
  id: string;
  url?: string;
  thumbnail?: string;
  publisher?: string;
  copyrighted?: boolean;
  creatorName?: string[];
  creditText?: string[];
  license?: {
    id: string;
    name: string;
    abbr?: string;
    attributionRequired?: boolean;
  }[];
}
