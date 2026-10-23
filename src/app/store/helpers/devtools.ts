import { EnvironmentProviders } from '@angular/core'
import { provideStoreDevtools } from '@ngrx/store-devtools'

// Production builds swap this file for devtools.prod.ts (angular.json `fileReplacements`), so Redux DevTools
// can't read or edit state there and its code isn't bundled. Import devtools from here, never from the packages.
export { withDevtools } from '@angular-architects/ngrx-toolkit'

export const devtoolsProviders: EnvironmentProviders[] = [
    provideStoreDevtools({
        maxAge: 25, // Retains last 25 states
        autoPause: true, // Pauses recording actions and state changes when the extension window is not open
        trace: false, //  If set to true, will include stack trace for every dispatched action, so you can see it in trace tab jumping directly to that part of code
        traceLimit: 75, // maximum stack trace frames to be stored (in case trace option was provided as true)
        connectInZone: true, // If set to true, the connection is established within the Angular zone
    }),
]
