import {
    APP_INITIALIZER,
    ApplicationConfig,
    importProvidersFrom,
    isDevMode,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core'
import { provideRouter } from '@angular/router'
import { routes } from './app.routes'
import { provideStoreDevtools } from '@ngrx/store-devtools'
import { provideHttpClient } from '@angular/common/http'
import i18next from 'i18next'
import HttpBackend from 'i18next-http-backend'
import { TranslatePipe } from './pipes/i18next.pipe'
import { AsyncPipe } from '@angular/common'
import { UrlPipe } from './pipes/url.pipe'
import { CalculateXpPipe } from './pipes/calculate-xp.pipe'

// export function ensureStateShapeMetaReducer(
//     reducer: ActionReducer<any>,
// ): ActionReducer<any> {
//     return (state, action) => {
//         const nextState = reducer(state, action)
//
//         if (!nextState) return nextState
//
//         const patchedState = { ...nextState }
//
//         for (const key of Object.keys(initialStates)) {
//             if (nextState[key]) {
//                 patchedState[key] = {
//                     ...initialStates[key],
//                     ...nextState[key],
//                 }
//             }
//         }
//
//         return patchedState
//     }
// }

// export function localStorageSyncReducer(
//     reducer: ActionReducer<any>,
// ): ActionReducer<any> {
//     return localStorageSync({ keys: ['game', 'player', 'battle'], rehydrate: true })(reducer)
// }

const translations = [
    'app', 'enemies', 'zones', 'skill-tree', 'items', 'spells', 'map', 'crafting', 'npc', 'quests',
    'dialogues/laHarparBartender',
    'dialogues/laHarparJosh',
    'dialogues/laHarparTrader',
    'dialogues/laHarparElara',
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
        // provideStore([], { metaReducers: [localStorageSyncReducer, ensureStateShapeMetaReducer] }),
        provideStoreDevtools({
            maxAge: 25, // Retains last 25 states
            logOnly: !isDevMode(), // Restrict extension to log-only mode
            autoPause: true, // Pauses recording actions and state changes when the extension window is not open
            trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
            traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
            connectInZone: true, // If set to true, the connection is established within the Angular zone
        }),
        {
            provide: APP_INITIALIZER,
            useFactory: i18nextInitializer,
            multi: true,
        },
        importProvidersFrom([TranslatePipe, AsyncPipe, UrlPipe, CalculateXpPipe]),

    ],
}
