import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FechaIsoAdapter, FORMATOS_FECHA } from './shared/utils/fecha-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),

    // Calendario (mat-datepicker): fechas 'AAAA-MM-DD', se muestran dd/mm/aaaa.
    { provide: MAT_DATE_LOCALE, useValue: 'es-BO' },
    { provide: DateAdapter, useClass: FechaIsoAdapter },
    { provide: MAT_DATE_FORMATS, useValue: FORMATOS_FECHA }
  ]
};
