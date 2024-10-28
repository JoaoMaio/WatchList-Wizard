import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { IndexedDBService } from './indexedDb.service';

export const cachingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  if (req.method !== 'GET') {
    return next(req);
  }

  const indexedDBService = new IndexedDBService();

  return new Observable(observer => {
    (async () => {
      // Check if the response is cached
      const cachedItem = await indexedDBService.get(req.urlWithParams);
      if (cachedItem) {
        observer.next(new HttpResponse({ status: 200, body: cachedItem.response }));
        observer.complete();
        return;
      }

      // If not found in cache, make the request
      next(req).pipe(
        tap(async event => {
          if (event instanceof HttpResponse) {
            await indexedDBService.put(req.urlWithParams, event.body);
          }
        })
      ).subscribe(observer); 
    })().catch(err => observer.error(err));
  });
};
