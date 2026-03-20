import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError, firstValueFrom } from 'rxjs';
import { EthMetagridComponent } from './eth-metagrid.component';
import { EthMetagridService } from './eth-metagrid.service';

describe('EthMetagridComponent', () => {
	let component: EthMetagridComponent;
	let fixture: ComponentFixture<EthMetagridComponent>;
	let metagridServiceSpy: jasmine.SpyObj<EthMetagridService>;
	let storeSpy: jasmine.SpyObj<Store>;
	let originalMutationObserver: typeof MutationObserver;
	const translateMock = {
		currentLang: 'de',
		stream: (key: string) => of(key)
	} as TranslateService;

	beforeEach(async () => {
		originalMutationObserver = window.MutationObserver;
		metagridServiceSpy = jasmine.createSpyObj<EthMetagridService>('EthMetagridService', [
			'getResourcesForGndIds',
			'getResourcesForIdRefs'
		]);
		storeSpy = jasmine.createSpyObj<Store>('Store', ['select']);
		storeSpy.select.and.returnValue(of(null));

		await TestBed.configureTestingModule({
			imports: [EthMetagridComponent],
			providers: [
				{ provide: EthMetagridService, useValue: metagridServiceSpy },
				{ provide: TranslateService, useValue: translateMock },
				{ provide: Store, useValue: storeSpy },
				{ provide: 'MODULE_PARAMETERS', useValue: { whitelist: [] } }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(EthMetagridComponent);
		component = fixture.componentInstance;
	});

	afterEach(() => {
		(window as any).MutationObserver = originalMutationObserver;
		document.querySelectorAll('nde-full-display-details').forEach(node => node.parentNode?.removeChild(node));
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});


	it('returns provider label for current language', () => {
		component.moduleParameters = { test: ['DE', 'EN', 'FR', 'IT'] } as any;
		translateMock.currentLang = 'en';

		const label = component.getProviderLabel('test');

		expect(label).toBe('EN');
	});


	it('falls back to slug when provider label is missing', () => {
		component.moduleParameters = { test: ['DE'] } as any;
		translateMock.currentLang = 'it';

		const label = component.getProviderLabel('test');

		expect(label).toBe('test');
	});


	it('returns fallback text when translation is missing', async () => {
		translateMock.currentLang = 'de';

		const result = await firstValueFrom(
			component.getI18nText('metagrid.link.open', { de: 'Open', en: 'Open EN' })
		);

		expect(result).toBe('Open');
	});


	it('aggregates persons from gnd and idref resources', async () => {
		const record = {
			pnx: {
				display: {
					lds03: [
						'(DE-588)12345',
						'GND: 67890',
						'http://www.idref.fr/123456789'
					]
				}
			}
		} as any;

		metagridServiceSpy.getResourcesForGndIds.and.returnValue(
			of([
				{ id: '1', gnd: '12345', resources: [{ uri: 'https://example.test', provider: 'p1' }] },
				{ id: '2', gnd: '67890', resources: [{ uri: 'https://example.test', provider: 'p1' }] }
			] as any)
		);
		metagridServiceSpy.getResourcesForIdRefs.and.returnValue(
			of([
				{ id: '3', idRef: '123456789', resources: [{ uri: 'https://example.test', provider: 'p1' }] }
			] as any)
		);

		const result = await firstValueFrom(component.getPersons(record));

		expect(result.length).toBe(3);
		expect(result.every(p => !!p.personId)).toBeTrue();
	});

    
	it('logs errors from metagrid service and continues', async () => {
		const consoleSpy = spyOn(console, 'error');
		const record = {
			pnx: {
				display: { lds03: ['GND: 12345', 'http://www.idref.fr/123456789'] }
			}
		} as any;

		metagridServiceSpy.getResourcesForGndIds.and.returnValue(throwError(() => new Error('boom')));
		metagridServiceSpy.getResourcesForIdRefs.and.returnValue(
			of([{ id: '3', idRef: '123456789', resources: [{ uri: 'https://example.test', provider: 'p1' }] }] as any)
		);

		const result = await firstValueFrom(component.getPersons(record));

		expect(consoleSpy).toHaveBeenCalled();
		expect(result.length).toBe(1);
	});


	it('starts observing full display details container when available', () => {
		const detailsContainer = document.createElement('nde-full-display-details');
		document.body.appendChild(detailsContainer);

		const observeSpy = jasmine.createSpy('observe');
		let constructorCalls = 0;
		class MockMutationObserver {
			observe = observeSpy;
			disconnect = jasmine.createSpy('disconnect');
			takeRecords = () => [] as MutationRecord[];
			constructor(_cb: MutationCallback) {
				constructorCalls += 1;
			}
		}
		(window as any).MutationObserver = MockMutationObserver as any;

		(component as any).observeDetailsContainer([]);

		expect(constructorCalls).toBe(1);
		expect(observeSpy).toHaveBeenCalledWith(detailsContainer, { childList: true, subtree: true });
	});


	it('copies metagrid links and disconnects observer when required nodes appear', () => {
		const detailsContainer = document.createElement('nde-full-display-details');
		const authorityContainer = document.createElement('div');
		authorityContainer.setAttribute('data-qa', 'detail_lds03');
		const card = document.createElement('div');
		card.className = 'metagrid-card';
		const link = document.createElement('a');
		link.className = 'metagrid-link';
		detailsContainer.appendChild(authorityContainer);
		detailsContainer.appendChild(card);
		detailsContainer.appendChild(link);
		document.body.appendChild(detailsContainer);

		let observerCallback: MutationCallback | undefined;
		class MockMutationObserver {
			observe = jasmine.createSpy('observe');
			disconnect = jasmine.createSpy('disconnect');
			takeRecords = () => [] as MutationRecord[];
			constructor(cb: MutationCallback) {
				observerCallback = cb;
			}
		}
		(window as any).MutationObserver = MockMutationObserver as any;

		const callbackDisconnectSpy = jasmine.createSpy('disconnect');
		const copySpy = spyOn(component, 'copyMetagridLinks');

		const persons = [{ personId: '123' }] as any;
		(component as any).observeDetailsContainer(persons);
		observerCallback?.([], { disconnect: callbackDisconnectSpy } as unknown as MutationObserver);

		expect(copySpy).toHaveBeenCalledWith(persons, authorityContainer);
		expect(callbackDisconnectSpy).toHaveBeenCalled();
		expect((component as any).detailsObserver).toBeUndefined();
	});


	it('disconnects previous observer before registering a new one', () => {
		const detailsContainer = document.createElement('nde-full-display-details');
		document.body.appendChild(detailsContainer);

		const observerInstances: Array<{ observe: jasmine.Spy; disconnect: jasmine.Spy; takeRecords: () => MutationRecord[] }> = [];
		class MockMutationObserver {
			observe = jasmine.createSpy('observe');
			disconnect = jasmine.createSpy('disconnect');
			takeRecords = () => [] as MutationRecord[];
			constructor(_cb: MutationCallback) {
				observerInstances.push(this);
			}
		}
		(window as any).MutationObserver = MockMutationObserver as any;

		(component as any).observeDetailsContainer([]);
		(component as any).observeDetailsContainer([]);

		expect(observerInstances.length).toBe(2);
		expect(observerInstances[0].disconnect).toHaveBeenCalled();
	});
});
