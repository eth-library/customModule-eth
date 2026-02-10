import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { EthErrorHandlingService } from './eth-error-handling.service';


describe('EthErrorHandlingService', () => {
  let service: EthErrorHandlingService;
  let consoleErrorSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EthErrorHandlingService]
    });

    service = TestBed.inject(EthErrorHandlingService);
    consoleErrorSpy = spyOn(console, 'error');
  });


  it('logs HttpErrorResponse with status details', () => {
    const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found', url: '/x' });

    service.logError(error, 'TestContext');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** :', 'Not Found (404) in TestContext');
    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
  });


  it('logs TypeError in logError', () => {
    const error = new TypeError('bad type');

    service.logError(error, 'Ctx');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** :', 'Type Error in Ctx: bad type');
  });


  it('logs Error in logError', () => {
    const error = new Error('boom');

    service.logError(error, 'Ctx');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** :', 'General Error in Ctx: boom');
  });


  it('logs string error in logError', () => {
    service.logError('oops', 'Ctx');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** :', 'String Error in Ctx: oops');
  });

  it('logs TypeError in logSyncError', () => {
    const error = new TypeError('bad type');

    service.logSyncError(error, 'Ctx');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** ', 'Type Error in Ctx: bad type');
  });
  

  it('logs Error in logSyncError', () => {
    const error = new Error('boom');

    service.logSyncError(error, 'Ctx');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** ', 'General Error in Ctx: boom');
  });

  it('logs string error in logSyncError', () => {
    service.logSyncError('oops', 'Ctx');

    expect(consoleErrorSpy).toHaveBeenCalledWith('**ETH** ', 'String Error in Ctx: oops');
  });
});
