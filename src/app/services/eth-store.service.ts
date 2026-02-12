import { Injectable } from '@angular/core';
import { createFeatureSelector, createSelector, select, Store } from '@ngrx/store';
import { filter, map, Observable, of, switchMap, tap } from 'rxjs';
import type { Params, Data } from '@angular/router';
import { StoreDeliveryEntity, HostComponent, PnxDoc, LinkedDataRecommendation } from '../models/eth.model';

type SearchParams = {q:string, tab:string, scope:string}
type SearchState = {searchParams: SearchParams, ids: string[], entities: Record<string, PnxDoc>}

interface RouterState {
  state: RouterRootState;
  navigationId: number;
}

interface RouterRootState {
  url: string;
  root: RouterNode;
}

interface RouterNode {
  url: { path: string; parameters: Params }[];
  params: Params;
  queryParams: Params;
  fragment: string | null;
  data: Data;
  outlet: string;
  title?: string;
  routeConfig: { path?: string | null } | null;
  firstChild?: RouterNode;
  children: RouterNode[];
}

type DeliveryEntity = Record<string, any>;
type DeliveryObject = Record<string, DeliveryEntity>;
type DeliveryEntities = {entities: DeliveryObject}
type FullDisplayState = {selectedRecordId:string, linkedDataRecommendations: LinkedDataRecommendation[]};

type EncodedJwt = string;
type UserState = {
  jwt: EncodedJwt,
  isLoggedIn: boolean,
  decodedJwt: DecodedJwt
}
type Account = {
  personalDetails: {
    email: {
      value: string
    },
    patronstatus: {
      registration: {
        institution: {
          patronstatuscode: string,
          patronstatusname: string,
          patronexpirydate: string,
          ilsinstitutioncode: string,
          ilsinstitutionname: string
        }[]
      }[]
    }[]
  }
}
type DecodedJwt = {
  language: string;
  onCampus: string;
  user: string;
  userGroup: string;
  displayName: string;
  userName: string;
  userIp: string;
  institution: string;
  authenticationProfile: string;
}

const selectUserState = createFeatureSelector<UserState>('user');
const selectAccount = createFeatureSelector<Account>('account');
const selectSearchState = createFeatureSelector<SearchState>('Search');
const selectViewConfigState = createFeatureSelector<any>('viewConfig');
const selectRouterState = createFeatureSelector<RouterState>('router');
const selectDeliveryState = createFeatureSelector<DeliveryEntities>('Delivery');
const selectFullDisplayState = createFeatureSelector<FullDisplayState>('full-display');
const selectLDEntityState = createFeatureSelector<any>('linked-data-entity');

const selectDeliveryEntities = createSelector(selectDeliveryState, state => state.entities);

const selectConfig = createSelector(selectViewConfigState,(state) => state.config);

const selectRouter = createSelector(selectRouterState,state => state.state);

const selectQuery = createSelector(selectRouterState,state => state.state.root.queryParams['query']);

const selectFullDisplayRecordId = createSelector(selectFullDisplayState, state => state.selectedRecordId);

const selectFullDisplayDeliveryEntities = createSelector(selectFullDisplayRecordId, selectDeliveryEntities, (recordId, deliveryEntities) => deliveryEntities[recordId]);

const selectSearchEntities = createSelector(selectSearchState, state => state.entities);

const selectFullDisplayRecord = createSelector(selectFullDisplayRecordId, selectSearchEntities, (recordId, searchEntities): PnxDoc => searchEntities[recordId]
);


const selectLinkedDataRecommendations = createSelector(selectFullDisplayState, state => state.linkedDataRecommendations);

const selectLDEntityId = createSelector(selectLDEntityState, state => state.entityId);
const selectLDEntityStatus = createSelector(selectLDEntityState, state => state.entityStatus);

const selectEMail = createSelector(selectAccount, state => state?.personalDetails?.email?.value);
const selectPatronStatusCode = createSelector(selectAccount, state => state?.personalDetails?.patronstatus[0]?.registration[0]?.institution[0]?.patronstatuscode);
const selectPatronStatusName = createSelector(selectAccount, state => state?.personalDetails?.patronstatus[0]?.registration[0]?.institution[0]?.patronstatusname);

const selectLoggedIn = createSelector(selectUserState, state => state?.isLoggedIn);
const selectOnCampus = createSelector(selectUserState, state => state?.decodedJwt?.onCampus);
const selectUserName = createSelector(selectUserState, state => state?.decodedJwt?.userName);
const selectUserGroup = createSelector(selectUserState, state => state?.decodedJwt?.userGroup);
const selectAuthenticationProfile = createSelector(selectUserState, state => state?.decodedJwt?.authenticationProfile);


const selectListviewRecord = (recordId: string) =>
  createSelector(
    selectSearchEntities,
    entities => entities[recordId]
  );

const selectListviewDeliveryEntity = (recordId: string) =>
  createSelector(
    selectDeliveryEntities,
    entities => entities[recordId]
  );



@Injectable({
  providedIn: 'root'
})
export class EthStoreService {

    readonly searchValue$: Observable<string>;
    readonly isOnCampus$: Observable<boolean>;
    readonly isLoggedIn$: Observable<boolean>;
    readonly patronstatusCode$: Observable<string>;
    readonly patronstatusName$: Observable<string>;
    readonly userName$: Observable<string>;
    readonly userGroup$: Observable<string>;
    readonly email$: Observable<string>;
    readonly authenticationProfile$: Observable<string>;
    readonly linkedDataRecommendations$: Observable<LinkedDataRecommendation[]>;
    readonly linkedDataEntityId$: Observable<string>;
    readonly linkedDataEntityStatus$: Observable<string>;
    
    constructor(
        private store: Store
    ){
        this.searchValue$ = this.store.pipe(
            select(selectQuery),
            map(q => q ?? '')
        );
        
        this.isOnCampus$ = this.store.pipe(
            select(selectOnCampus),
            map(v => v === 'true')
        );

        this.isLoggedIn$ = this.store.pipe(
            select(selectLoggedIn)
        );        

        this.patronstatusCode$ = this.store.pipe(
            select(selectPatronStatusCode)
        );             

        this.patronstatusName$ = this.store.pipe(
            select(selectPatronStatusName)
        );             
        
        this.userName$ = this.store.pipe(
            select(selectUserName)
        );             

        this.userGroup$ = this.store.pipe(
            select(selectUserGroup)
        );             

        this.email$ = this.store.pipe(
            select(selectEMail)
        );         

        this.authenticationProfile$ = this.store.pipe(
            select(selectAuthenticationProfile)
        );             

        this.linkedDataRecommendations$ = this.store.pipe(
            select(selectLinkedDataRecommendations)
        );         

        this.linkedDataEntityId$ = this.store.pipe(
            select(selectLDEntityId)
        );        
        this.linkedDataEntityStatus$ = this.store.pipe(
            select(selectLDEntityStatus)
        );           
    }

    getVid(): string {
        return this.store.selectSignal(selectConfig)()?.vid;
    }    

    getScope(): string{
        const router =  this.store.selectSignal(selectRouter)();
        const scopeFromUrl = router?.root?.queryParams?.['search_scope'];
        if(scopeFromUrl){
            return scopeFromUrl;
        }
        let vc =  this.store.selectSignal(selectConfig)();
        return vc['primo-view']?.scopes[0]?.['scope-id'];
    }

    getTab(): string {
        const router = this.store.selectSignal(selectRouter)();
        const tabFromUrl = router?.root?.queryParams?.['tab'];
        if (tabFromUrl) {
            return tabFromUrl;
        }
        const vc = this.store.selectSignal(selectConfig)();
        return vc['primo-view']?.scopes[0]?.tab;
    }

    getRouter$(): Observable<RouterRootState> {
        return this.store.select(selectRouter);
    }

    isFullview$(): Observable<boolean> {
        return this.getRouter$().pipe(
            map(state => {
                if (!state?.url) {
                    return false;
                }
                return state.url.includes('/fulldisplay');
            })
        );
    }

    getFullDisplayRecord$(): Observable<PnxDoc> {
        return this.store.select(selectFullDisplayRecord).pipe(
            filter((doc): doc is PnxDoc => doc !== null)
        );
    }


    getRecord$(hostComponent: HostComponent): Observable<PnxDoc> {
        const recordId = hostComponent?.searchResult?.pnx?.control?.recordid[0] ?? '';
        return this.store.select(selectFullDisplayRecord).pipe(
            switchMap(record =>
                record
                ? of(record)
                : this.store.select(selectListviewRecord(recordId))
            )
        );
    }


    getFullDisplayDeliveryEntity$(): Observable<StoreDeliveryEntity> {
        return this.store.select(selectFullDisplayDeliveryEntities);
    }


    getDeliveryEntity$(hostComponent: HostComponent): Observable<StoreDeliveryEntity> {
        const recordId = hostComponent?.searchResult?.pnx?.control?.recordid[0] ?? '';
        return this.store.select(selectFullDisplayDeliveryEntities).pipe(
            switchMap(record =>
                record
                ? of(record)
                : this.store.select(selectListviewDeliveryEntity(recordId))
            )
        );
    }


}
