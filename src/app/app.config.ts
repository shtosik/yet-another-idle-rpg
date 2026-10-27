import {
    APP_INITIALIZER,
    ApplicationConfig,
    importProvidersFrom,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { routes } from './app.routes'
import { devtoolsProviders } from './store/helpers/devtools'
import { provideHttpClient } from '@angular/common/http'
import i18next from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { I18nextPipe } from './pipes/i18next.pipe'
import { AsyncPipe } from '@angular/common'
import { UrlPipe } from './pipes/url.pipe'
import { CalculateXpPipe } from './pipes/calculate-xp.pipe'

const translations = [
    'app', 'enemies', 'zones', 'skill-tree', 'items', 'spells', 'map', 'camp', 'npc', 'quests', 'shop', 'bestiary', 'unlocks',
    'dialogues/laHarparBartender',
    'dialogues/laHarparJosh',
    'dialogues/laHarparTrader',
    'dialogues/laHarparElara',
    'dialogues/laHarparMarvin',
    'dialogues/mawoodCorwin',
    'dialogues/mawoodSylvie',
    'dialogues/mawoodFinn',
    'dialogues/mawoodBrenn',
    'dialogues/mawoodMilo',
    'dialogues/liroldArenaMaster',
    'dialogues/mawoodElarion',
]

export function i18nextInitializer() {
    return () =>
        i18next
            .use(HttpBackend)
            .init({
                lng: 'en',
                fallbackLng: 'en',
                backend: {
                    loadPath: '/assets/locales/{{lng}}/{{ns}}.json',
                },
                ns: translations,
                defaultNS: 'app',
                interpolation: {
                    escapeValue: false,
                },
            })
}


export const appConfig: ApplicationConfig = {
    providers: [
        provideHttpClient(),
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection(),
        provideRouter(routes),
        // Empty in production builds (store/helpers/devtools.prod.ts).
        ...devtoolsProviders,
        {
            provide: APP_INITIALIZER,
            useFactory: i18nextInitializer,
            multi: true,
        },
        importProvidersFrom([I18nextPipe, AsyncPipe, UrlPipe, CalculateXpPipe]),

    ],
}
