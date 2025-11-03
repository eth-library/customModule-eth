import { HttpRequest, HttpHandlerFn, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export function ethHttpInterceptor(req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> {
  return next(req).pipe(
    map(event => {
      if (event instanceof HttpResponse) {
        try {
          console.error('event.url ',event.url)
          if (/primaws\/rest\/pub\/translations\/41SLSP_ETH:ETH_NDE/.test(event.url!)) {
            if (event.status === 200) {
              if (event.body && typeof event.body === 'object') {
                const modifiedBody = {
                  ...event.body, 
                  ['facets.facet.facet_library.5503–112050810005503']: 'ETH Thomas-Mann-Archiv'
                };
                return event.clone({ body: modifiedBody });
              } else {
                console.warn('Event body is no objekt:', event.body);
              }
            }
          }
        } catch (error) {
          console.error('error in interceptor:', error);
        }
      }
      return event;
    }),
    catchError((error: HttpErrorResponse) => {
      return throwError(() => error);
    })
  );
}
