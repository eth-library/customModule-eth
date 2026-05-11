import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class EthErrorHandlingService {

  logError(error: unknown, context: string = 'Unknown Context'): void {
    console.error('**ETH** :', this.buildErrorMessage(error, context));
    console.error(error);
  }

  private buildErrorMessage(error: unknown, context: string): string {
    if (error instanceof HttpErrorResponse) {
      return this.getHttpErrorMessage(error, context);
    }

    if (error instanceof TypeError) {
      return `Type Error in ${context}: ${error.message}`;
    }

    if (error instanceof Error) {
      return `General Error in ${context}: ${error.message}`;
    }

    if (typeof error === 'string') {
      return `String Error in ${context}: ${error}`;
    }

    return `Error in ${context}: An unknown error occurred`;
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
