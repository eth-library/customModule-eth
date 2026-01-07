import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, of, forkJoin } from 'rxjs';

interface MetagridResourceRaw {
  _type: string;
  identifier: string;
  provider: { slug: string; uri: string };
  link: { rel: string; uri: string };
  concordance: { id: string; uri: string };
  metadata: { first_name?: string; last_name?: string; birth_date?: string; death_date?: string };
}

interface MetagridConcordanceRaw {
  id: string;
  legacy_id?: number;
  name?: string | null;
  uri?: string;
  resources?: MetagridResourceRaw[];
}

interface MetagridResponse {
  meta: { total: number; start: number; limit: number; uri: string };
  concordances: MetagridConcordanceRaw[];
}

interface Resource {
  provider: string;
  uri: string;
  metadata: {
    first_name: string;
    last_name: string;
    birth_date: string;
    death_date: string;
  };
}

export interface Person {
  id: string | null;
  gnd: string | null;
  idRef: string | null;
  personId: string | null;
  name: string | null;
  resources: Resource[] | null;
}

@Injectable({
  providedIn: 'root'
})
export class EthMetagridService {
  private readonly BASE_URL = 'https://api.metagrid.ch/search';

  constructor(private http: HttpClient) {}

  /**
   * @param gndIds    list of GND IDs
   * @param whitelist whitelist of provider.slugs (e.g. ['gnd', 'viaf'])
   * @returns Observable of a person array
  */
  getResourcesForGndIds( gndIds: string[], whitelist: string[] ): Observable<Person[]> {

    const requests = gndIds.map(gndId => {
      const url =
        `${this.BASE_URL}?group=1&skip=0&take=50&provider=gnd&query=${encodeURIComponent(gndId)}`;

      return this.http.get<MetagridResponse>(url).pipe(
        catchError(err => {
          console.error(`error in Metagrid addon service: GND ${gndId}:`, err);
          return of(null);
        }),
        map(response =>
          this.mapResponseToPerson(response, whitelist, { gnd: gndId })
        )
      );
    });

    return forkJoin(requests);
  }

  /**
   * @param gndIds    list of idRefs
   * @param whitelist whitelist of provider.slugs (e.g. ['gnd', 'viaf'])
   * @returns Observable of a person array
  */

  getResourcesForIdRefs(
    idRefs: string[],
    whitelist: string[]
  ): Observable<Person[]> {

    const requests = idRefs.map(idRef => {
      const url =
        `${this.BASE_URL}?group=1&skip=0&take=50&provider=sudoc&query=${encodeURIComponent(idRef)}`;

      return this.http.get<MetagridResponse>(url).pipe(
        catchError(err => {
          console.error(`error in Metagrid addon service: IdRef ${idRef}:`, err);
          return of(null);
        }),
        map(response =>
          this.mapResponseToPerson(response, whitelist, { idRef: idRef })
        )
      );
    });

    return forkJoin(requests);
  }

  /**
   * @param response raw metagrid response
   * @param whitelist whitelist of provider.slugs (e.g. ['gnd', 'viaf'])
   * @param ids gnd or idRef
   * @returns person
  */
  private mapResponseToPerson( response: MetagridResponse | null, whitelist: string[], ids: { gnd?: string; idRef?: string }): Person {

    if (!response) {
      return {
        id: null,
        gnd: ids.gnd ?? null,
        idRef: ids.idRef ?? null,
        personId: null,
        name: null,
        resources: []
      };
    }

    const concordances = response.concordances ?? [];

    const resources: Resource[] = concordances.flatMap(conc =>
      (conc.resources ?? [])
        .filter(res => whitelist.includes(res.provider.slug))
        .map(res => ({
          provider: res.provider.slug,
          uri: res.link.uri,
          metadata: {
            first_name: res.metadata.first_name ?? '',
            last_name: res.metadata.last_name ?? '',
            birth_date: res.metadata.birth_date ?? '',
            death_date: res.metadata.death_date ?? ''
          }
        }))
    );

    const id =
      concordances.length
        ? concordances[concordances.length - 1].id
        : null;

    const resourceWithName = resources.find(r => r.metadata.last_name);

    const fallbackName = concordances[0]?.name ?? null;
    const firstName = resourceWithName?.metadata.first_name ?? '';
    const lastName = resourceWithName?.metadata.last_name ?? '';

    const name =
      (firstName || lastName)
        ? `${firstName} ${lastName}`.trim()
        : fallbackName;

    return {
      id,
      gnd: ids.gnd ?? null,
      idRef: ids.idRef ?? null,
      personId: null,
      name,
      resources
    };
  }
  
}