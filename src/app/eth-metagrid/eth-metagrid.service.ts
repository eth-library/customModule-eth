import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, catchError, of, forkJoin } from 'rxjs';

export interface Resource {
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
  id: string;
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
      const url = `${this.BASE_URL}?group=1&skip=0&take=50&provider=gnd&query=${encodeURIComponent(gndId)}`;
      return this.http.get<any>(url).pipe(
        catchError(err => {
          console.error(`error in Metagrid addon service: GND ${gndId}:`, err);
          return of(null);
        }),
        map(response => {
          if (!response) {
            return { id:'', gnd: gndId, idRef: null, name: null, personId:null, resources: [] } as Person;
          }
          const allResources = response.concordances.flatMap((conc: any) =>
            conc.resources
              .filter((res: any) => whitelist.includes(res.provider.slug))
              .map((res: any) => ({
                provider: res.provider.slug,
                uri: res.link.uri,
                metadata: {
                  first_name: res.metadata.first_name,
                  last_name: res.metadata.last_name,
                  birth_date: res.metadata.birth_date,
                  death_date: res.metadata.death_date,
                }
              }))
          );
          const id = response.concordances.length > 0 ? response.concordances[response.concordances.length-1].id : null;
          const resourceWithName = allResources.find(
            (res: any) => res.metadata.last_name
          );
         
          const name = resourceWithName
            ? `${resourceWithName.metadata.first_name ?? ''} ${resourceWithName.metadata.last_name}`.trim()
            : response.concordances.length
              ? response.concordances[0].name
              : null;

           return { id: id, gnd: gndId, idRef: null, personId:null, name: name, resources: allResources };
        })
      );
    });
    return forkJoin(requests);
  }

  /**
   * @param gndIds    list of idRefs
   * @param whitelist whitelist of provider.slugs (e.g. ['gnd', 'viaf'])
   * @returns Observable of a person array
  */
  getResourcesForIdRefs( idRefs: string[], whitelist: string[] ): Observable<Person[]> {
    const requests = idRefs.map(idRef => {
      const url = `${this.BASE_URL}?group=1&skip=0&take=50&provider=sudoc&query=${encodeURIComponent(idRef)}`;
      return this.http.get<any>(url).pipe(
        catchError(err => {
          console.error(`error in Metagrid addon service: IdRef ${idRef}:`, err);
          return of(null);
        }),
        map(response => {
          if (!response) {
            return { id:'', gnd:null, idRef: idRef, name: null, personId:null, resources: [] } as Person;
          }
          const allResources = response.concordances.flatMap((conc: any) =>
            conc.resources
              .filter((res: any) => whitelist.includes(res.provider.slug))
              .map((res: any) => ({
                provider: res.provider.slug,
                uri: res.link.uri,
                metadata: {
                  first_name: res.metadata.first_name,
                  last_name: res.metadata.last_name,
                  birth_date: res.metadata.birth_date,
                  death_date: res.metadata.death_date,
                }
              }))
          );

          const id = response.concordances.length > 0 ? response.concordances[response.concordances.length-1].id : null;

          const resourceWithName = allResources.find(
            (res: any) => res.metadata.last_name
          );

          const name = resourceWithName
            ? `${resourceWithName.metadata.first_name ?? ''} ${resourceWithName.metadata.last_name}`.trim()
            : response.concordances.length
              ? response.concordances[0].name
              : null;

          return {id: id, gnd:null, idRef: idRef, personId:null, name:name, resources: allResources };
        })
      );
    });
    return forkJoin(requests);
  }

}