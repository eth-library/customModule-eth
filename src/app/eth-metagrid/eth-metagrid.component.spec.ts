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
	const translateMock = {
		currentLang: 'de',
		stream: (key: string) => of(key)
	} as TranslateService;

	beforeEach(async () => {
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
});
