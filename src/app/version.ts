// Named import: the bundle keeps `version` only, not the rest of package.json.
import { version } from '../../package.json'

/** The running build's MAJOR.MINOR.PATCH, from package.json (docs/deployment.md, Releases). */
export const APP_VERSION: string = version
