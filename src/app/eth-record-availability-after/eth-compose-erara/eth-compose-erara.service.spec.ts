import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EthComposeEraraService } from './eth-compose-erara.service';
import { EthErrorHandlingService } from '../../services/eth-error-handling.service';
import { EraraEMapsMapAPIResponse, PrimoApiResponse } from '../../models/eth.model';


describe('EthComposeEraraService', () => {
    let service: EthComposeEraraService;
    let httpMock: HttpTestingController;
    let errorHandlingSpy: jasmine.SpyObj<EthErrorHandlingService>;

    beforeEach(() => {
        errorHandlingSpy = jasmine.createSpyObj<EthErrorHandlingService>('EthErrorHandlingService', ['logError']);
        TestBed.configureTestingModule({
        providers: [
            EthComposeEraraService,
            provideHttpClient(),
            provideHttpClientTesting(),
            { provide: EthErrorHandlingService, useValue: errorHandlingSpy }
        ]
        });
        service = TestBed.inject(EthComposeEraraService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
  

    it('should fetch online erara record', () => {
        const mmsid = '990042488650205503';
        const mockResponse: PrimoApiResponse = {} as PrimoApiResponse;
        service.getOnlineEraraRecord(mmsid).subscribe(response => {
            expect(response).toEqual(mockResponse);
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/search?q=any,contains,MMS_ID_PRINT_${encodeURIComponent(mmsid)}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });
    

    it('fetch online erara record: should return null for 404', () => {
        const mmsid = 'notfound';
        service.getOnlineEraraRecord(mmsid).subscribe(response => {
        expect(response).toBeNull();
        expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/search?q=any,contains,MMS_ID_PRINT_${encodeURIComponent(mmsid)}`);
        req.flush({}, { status: 404, statusText: 'Not Found' });
    });


    it('fetch online erara record: should log error for non-404', () => {
        const mmsid = '1234';
        service.getOnlineEraraRecord(mmsid).subscribe({
        next: () => fail('should error'),
        error: () => {
            expect(errorHandlingSpy.logError).toHaveBeenCalled();
        }
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/search?q=any,contains,MMS_ID_PRINT_${encodeURIComponent(mmsid)}`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
    });


    it('should fetch erara record for emap', () => {
        const mmsid = '99117999050805503';
        const mockResponse: EraraEMapsMapAPIResponse = {} as EraraEMapsMapAPIResponse;
        service.getEraraRecordForEMap(mmsid).subscribe(response => {
        expect(response).toEqual(mockResponse);
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?emap=${encodeURIComponent(mmsid)}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });


    it('should fetch erara record: should return null for 404', () => {
        const mmsid = 'notfound';
        service.getEraraRecordForEMap(mmsid).subscribe(response => {
        expect(response).toBeNull();
        expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?emap=${encodeURIComponent(mmsid)}`);
        req.flush({}, { status: 404, statusText: 'Not Found' });
    });


    it('should fetch erara record: should log error for non-404', () => {
        const mmsid = 'err';
        service.getEraraRecordForEMap(mmsid).subscribe({
        next: () => fail('should error'),
        error: () => {
            expect(errorHandlingSpy.logError).toHaveBeenCalled();
        }
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?emap=${encodeURIComponent(mmsid)}`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
    });


    it('should fetch emaps record', () => {
        const mmsid = '990038990900205503';
        const mockResponse: EraraEMapsMapAPIResponse = {} as EraraEMapsMapAPIResponse;
        service.getEMapsRecord(mmsid).subscribe(response => {
        expect(response).toEqual(mockResponse);
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?erara=${encodeURIComponent(mmsid)}`);
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);
    });


    it('should fetch emaps record: should return null for 404', () => {
        const mmsid = 'notfound';
        service.getEMapsRecord(mmsid).subscribe(response => {
        expect(response).toBeNull();
        expect(errorHandlingSpy.logError).not.toHaveBeenCalled();
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?erara=${encodeURIComponent(mmsid)}`);
        req.flush({}, { status: 404, statusText: 'Not Found' });
    });


    it('should fetch emaps record: should log error for non-404', () => {
        const mmsid = 'err';
        service.getEMapsRecord(mmsid).subscribe({
        next: () => fail('should error'),
        error: () => {
            expect(errorHandlingSpy.logError).toHaveBeenCalled();
        }
        });
        const req = httpMock.expectOne(`https://daas.library.ethz.ch/rib/v3/graph/emaps-erara?erara=${encodeURIComponent(mmsid)}`);
        req.flush({}, { status: 500, statusText: 'Server Error' });
    });
});
