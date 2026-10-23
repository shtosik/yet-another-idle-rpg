import { EnvironmentProviders } from '@angular/core'

// Production replacement for devtools.ts: same exports, connects nothing.
export { withDevToolsStub as withDevtools } from '@angular-architects/ngrx-toolkit'

export const devtoolsProviders: EnvironmentProviders[] = []
