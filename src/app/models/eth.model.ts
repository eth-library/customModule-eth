import { Observable } from "rxjs";

/* delivery */
export interface DeliveryEntity {
  delivery?: {
    electronicServices?: ElectronicService[];
  };
}
export interface ElectronicService {
  serviceUrl: string;
}
export interface ViewModel {
  onlineLinks?: unknown[];
}
 
/* pnx */
export interface Doc  {
  pnx?: {
    display?: {
      title?: string[];
      lds03?: string[];
      lds50?: string[];
      lds90?: string[];
      type?: string[]
    };
    addata?: {
      doi?: string[];
      openaccess?: string[];
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

/* Location */
export interface Location {
  libraryCode?: string;
  subLocationCode?: string;
  mainLocation?: string;
  ilsApiId?: string;
}

/* FilterGroup */
export interface FilterGroup {
  id?: string;
}

/* HostComponentService */
export interface HostComponentService {
  type?: string;
}

/* HostComponent */
export interface HostComponent {
  location?: Location;
  searchResult?: Doc;
  expanded?: boolean;
  isOpen?: boolean;
  filtersVisible?: boolean;
  filterGroup?: FilterGroup;
  filterList$?: any; 
  _service?: HostComponentService;
  viewModel$?: ViewModel;
}

/* news */
export interface NewsFeed {
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

/* Connected Papers */
export interface ConnectedPapersResponse {
  id: string;
  citationCount?: number;
  referenceCount?: number;
}

/* Hint from Git */
export interface GitHintResponse {
  de: string; 
  en: string;
};


/* check if needed */
export interface MetagridResults {
  meta: { total: number };
  concordances: Array<{
    id: string;
    name: string;
    uri: string;
    resources: Array<{
      link: { uri: string };
      metadata: {
        first_name: string;
        last_name: string;
        birth_date?: string;
        death_date?: string;
      };
      provider: { slug: string };
    }>;
  }>;
}

export interface Person {
  id: string;
  name: string;
  uri: string;
  resources: Resource[];
}

export interface Resource {
  link: { uri: string };
  metadata: { first_name: string; last_name: string; birth_date?: string; death_date?: string };
  provider: Provider;
}

export interface Provider {
  slug: string;
  label: string;
}


export type Persons = {
  name: string,
  resources: {
      link: {
        uri: string
      },
      metadata: {
        first_name: string,
        last_name: string
      },
      provider: {
        slug: string
      }
  }[]
}[]
  
export type ApiResults = {
  results: {
      provider: string,
      resp: {
        concordances: Persons
      }
  }[]
}
  