import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';

const cacheKey = 'httpCache';

const loadCache = (): Map<string, any> => {
  const cachedData = localStorage.getItem(cacheKey);
  return cachedData ? new Map(JSON.parse(cachedData)) : new Map();
};

const saveCache = (cache: Map<string, any>) => {
  localStorage.setItem(cacheKey, JSON.stringify(Array.from(cache.entries())));
};


const cache: Map<string, any> = loadCache(); // Changed to store data instead of HttpResponse

export const cachingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn): Observable<HttpEvent<any>> => {
  if (req.method !== 'GET') {
    return next(req);
  }

  const cachedResponse = cache.get(req.urlWithParams);

  if (cachedResponse) {
    return of(new HttpResponse({ status: 200, body: cachedResponse })); // Wrap in HttpResponse
  }

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        cache.set(req.urlWithParams, event.body); // Cache the response body
        saveCache(cache); // Save the updated cache to localStorage
      }
    })
  );
};
