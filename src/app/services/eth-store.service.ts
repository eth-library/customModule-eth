import { Injectable } from '@angular/core';
import { PnxDoc } from '../models/eth.model';
import { createFeatureSelector, createSelector, select, Store } from '@ngrx/store';
import { catchError, EMPTY, filter, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { EthErrorHandlingService } from './eth-error-handling.service';
import type { Params, Data } from '@angular/router';
import { StoreDeliveryEntity, HostComponent } from '../models/eth.model';

type SearchParams = {q:string, tab:string, scope:string}
type SearchState = {searchParams: SearchParams, ids: string[], entities: Record<string, PnxDoc>}

export interface RouterState {
  state: RouterRootState;
  navigationId: number;
}

export interface RouterRootState {
  url: string;
  root: RouterNode;
}

export interface RouterNode {
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
type FullDisplayState = {selectedRecordId:string, linkedDataRecommendations: any};

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

const selectSearchParams = createSelector(selectSearchState,(state: SearchState) => state.searchParams);

const selectConfig = createSelector(selectViewConfigState,(state: any) => state.config);

const selectRouter = createSelector(selectRouterState,state => state.state);

const selectQuery = createSelector(selectRouterState,state => state.state.root.queryParams['query']);

const selectFullDisplayRecordId = createSelector(selectFullDisplayState, state => state.selectedRecordId ?? null);

const selectFullDisplayDeliveryEntities = createSelector(selectFullDisplayRecordId, selectDeliveryEntities, (recordId, deliveryEntities) => deliveryEntities[recordId]);

const selectSearchEntities = createSelector(selectSearchState, state => state.entities);

const selectFullDisplayRecord = createSelector(selectFullDisplayRecordId, selectSearchEntities, (recordId, searchEntities): PnxDoc | null => searchEntities[recordId] ?? null
);


const selectLinkedDataRecommendations = createSelector(selectFullDisplayState, state => state.linkedDataRecommendations ?? null);

const selectLDEntityId = createSelector(selectLDEntityState, state => state.entityId ?? null);

const selectEMail = createSelector(selectAccount, state => state?.personalDetails?.email?.value ?? null);
const selectPatronStatusCode = createSelector(selectAccount, state => state?.personalDetails?.patronstatus[0]?.registration[0]?.institution[0]?.patronstatuscode ?? null);
const selectPatronStatusName = createSelector(selectAccount, state => state?.personalDetails?.patronstatus[0]?.registration[0]?.institution[0]?.patronstatusname ?? null);

const selectLoggedIn = createSelector(selectUserState, state => state?.isLoggedIn ?? true);
const selectOnCampus = createSelector(selectUserState, state => state?.decodedJwt?.onCampus ?? 'false');
const selectUserName = createSelector(selectUserState, state => state?.decodedJwt?.userName ?? null);
const selectUserGroup = createSelector(selectUserState, state => state?.decodedJwt?.userGroup ?? null);
const selectAuthenticationProfile = createSelector(selectUserState, state => state?.decodedJwt?.authenticationProfile ?? null);


const selectListviewRecord = (recordId: string) =>
  createSelector(
    selectSearchEntities,
    entities => entities[recordId] ?? null
  );

const selectListviewDeliveryEntity = (recordId: string) =>
  createSelector(
    selectDeliveryEntities,
    entities => entities[recordId] ?? null
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
    readonly linkedDataRecommendations$: Observable<any>;
    readonly linkedDataEntityId$: Observable<any>;
    readonly record$: Observable<any>;
    
    constructor(
        private ethErrorHandlingService: EthErrorHandlingService,
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
        
        this.record$ = this.store.pipe(
            select(selectFullDisplayRecord)
        );        

    }

    getVid(): string | null {
        try{
            let vc =  this.store.selectSignal(selectConfig)();
            return vc.vid;
        }
        catch(e){
            this.ethErrorHandlingService.logSyncError(e, 'EthStoreService.getVid');
            return null;
        }
    }

    getScope(): string | null {
        try{
            const router =  this.store.selectSignal(selectRouter)();
            const scopeFromUrl = router?.root?.queryParams?.['search_scope'];
            if(scopeFromUrl){
                return scopeFromUrl;
            }

            let vc =  this.store.selectSignal(selectConfig)();
            const scope = vc['primo-view']?.scopes[0]?.['scope-id']
            return scope;
        }
        catch(e){
            this.ethErrorHandlingService.logSyncError(e, 'EthStoreService.getScope');
            return null;
        }
    }

    getTab(): string | null {
        try {
            const router = this.store.selectSignal(selectRouter)();
            const tabFromUrl = router?.root?.queryParams?.['tab'];
            if (tabFromUrl) {
                return tabFromUrl;
            }

            const vc = this.store.selectSignal(selectConfig)();
            return vc['primo-view']?.scopes[0]?.tab ?? null;
        } catch (e) {
            this.ethErrorHandlingService.logSyncError(e, 'EthStoreService.getTab');
            return null;
        }
    }

    getRouter$(): Observable<RouterRootState> {
        return this.store.select(selectRouter).pipe(
            catchError((e) => {
                this.ethErrorHandlingService.logError(e, 'EthStoreService.getRouter$');
                return throwError(() => e); 
            })
        );
    }

    isFullview$(): Observable<boolean> {
        return this.getRouter$().pipe(
            map(state => {
                if (!state?.url) {
                    return false;
                }
                return state.url.includes('/fulldisplay');
            }),
            catchError(e => {
                this.ethErrorHandlingService.logError(e, 'EthStoreService.isFullview$');
                return throwError(() => e); 
            })
        );
    }

    getFullDisplayRecord$(): Observable<PnxDoc> {
        return this.store.select(selectFullDisplayRecord).pipe(
            filter((doc): doc is PnxDoc => doc !== null),
            catchError((e) => {
                this.ethErrorHandlingService.logError(e, 'EthStoreService.getFullDisplayRecord$');
                return throwError(() => e);
            })
        );
    }


    getRecord$(hostComponent: HostComponent): Observable<PnxDoc> {
        const recordId = hostComponent?.searchResult?.pnx?.control?.recordid[0] ?? '';
        return this.store.select(selectFullDisplayRecord).pipe(
            switchMap(record =>
                record
                ? of(record)
                : this.store.select(selectListviewRecord(recordId))
            ),
            catchError((e) => {
                this.ethErrorHandlingService.logError(e, 'EthStoreService.getRecord$');
                return throwError(() => e);
            })
        );
    }


    getFullDisplayDeliveryEntity$(): Observable<StoreDeliveryEntity> {
        return this.store.select(selectFullDisplayDeliveryEntities).pipe(
            catchError((e) => {
                this.ethErrorHandlingService.logError(e, 'EthStoreService.getFullDisplayDeliveryEntity$');
                return throwError(() => e);
            })
        );
    }


    getDeliveryEntity$(hostComponent: HostComponent): Observable<StoreDeliveryEntity> {
        const recordId = hostComponent?.searchResult?.pnx?.control?.recordid[0] ?? '';
        return this.store.select(selectFullDisplayDeliveryEntities).pipe(
            switchMap(record =>
                record
                ? of(record)
                : this.store.select(selectListviewDeliveryEntity(recordId))
            ),
            catchError((e) => {
                this.ethErrorHandlingService.logError(e, 'EthStoreService.getDeliveryEntity$');
                return throwError(() => e);
            })
        );
    }


}
