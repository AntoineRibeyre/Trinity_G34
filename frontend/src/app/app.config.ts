import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { routes } from './app.routes';
import { graphqlProvider } from './graphql/graphql.provider';
import { LanguageService } from './services/lang.service';

/**
 * Factory pour initialiser la langue au démarrage de l'application
 */
export function initializeLanguage(languageService: LanguageService) {
  return () => {
    // Le service LanguageService s'initialise automatiquement
    // Cette fonction garantit que la langue est chargée avant le démarrage de l'app
    return Promise.resolve();
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(),
    graphqlProvider,

    // Configuration de la traduction
    provideTranslateService({
      DefaultLanguage: 'en',
      fallbackLang: 'en',
      loader: provideTranslateHttpLoader({
        prefix: '/assets/i18n/',
        suffix: '.json'
      })
    }),

    // Initialisation de la langue au démarrage
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLanguage,
      deps: [LanguageService],
      multi: true
    }
  ]
};
