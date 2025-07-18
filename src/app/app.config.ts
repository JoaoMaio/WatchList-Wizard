import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { cachingInterceptor } from '../services/cache.interceptor';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';


export const appConfig: ApplicationConfig = {
  providers: [
      provideZoneChangeDetection({ eventCoalescing: true }), 
      provideRouter(routes),
      provideAnimationsAsync(),
      provideHttpClient(withInterceptors([cachingInterceptor])), provideCharts(withDefaultRegisterables()), 
      provideCharts(withDefaultRegisterables())
    ]
};
