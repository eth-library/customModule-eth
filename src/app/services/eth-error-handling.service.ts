import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EthErrorHandlingService {

  // observable
  handleError(error: unknown, context: string = 'Unknown Context'): Observable<never> {
    let errorMessage = `Error in ${context}: An unknown error occurred`;
    if (error instanceof HttpErrorResponse) {
      errorMessage = this.getHttpErrorMessage(error, context);
    } else if (error instanceof TypeError) {
      errorMessage = `Type Error in ${context}: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = `General Error in ${context}: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = `String Error in ${context}: ${error}`;
    }
    console.error('**ETH** :', errorMessage);
    return throwError(() => new Error(errorMessage)); 
  }

  // catch block
  handleSynchronError(error: unknown, context: string = 'Unknown Context'): any{
    let errorMessage = `Error in ${context}: An unknown error occurred`;
    if (error instanceof TypeError) {
      errorMessage = `Type Error in ${context}: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = `General Error in ${context}: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = `String Error in ${context}: ${error}`;
    }
    console.error('**ETH** ', errorMessage);
  }

  private getHttpErrorMessage(error: HttpErrorResponse, context: string): string {
    switch (error.status) {
      case 400: return `Bad Request (400) in ${context}`;
      case 401: return `Unauthorized (401) in ${context}`;
      case 403: return `Forbidden (403) in ${context}`;
      case 404: return `Not Found (404) in ${context}`;
      case 500: return `Internal Server Error (500) in ${context}`;
      default: return `HTTP Error ${error.status} in ${context}: ${error.message}`;
    }
  }

}
