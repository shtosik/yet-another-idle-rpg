import { bootstrapApplication } from '@angular/platform-browser'
import { appConfig } from './app/app.config'
import { App } from './app/app'
import { environment } from './environments/environment'
import { installDevStub } from './app/components/game/dev-cheats/dev-stub'

// Before bootstrap, so window.dev exists from the first moment the page can run a script.
if (environment.cheats) installDevStub()

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err))
