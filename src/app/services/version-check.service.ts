import { Injectable, signal } from '@angular/core'
import { APP_VERSION } from '../version'
import { saveGameStateNow } from '../store/helpers/with-game-state-sync.hook'

const CHECK_INTERVAL_IN_MS = 5 * 60 * 1000

/** `/version.json`, written next to the build by scripts/write-version.mjs. */
export interface BuildInfo {
    version: string
    /** Changes on every deploy, also one without a version bump (staging). */
    commit: string
}

/**
 * Polls `/version.json` and flags a newer deploy than the running one. The first answer is the baseline,
 * since the bundle knows its version but not its commit. Dev builds have no `version.json`, so nothing shows.
 */
@Injectable({ providedIn: 'root' })
export class VersionCheckService {
    /** The deploy that is newer than the running build, once one is found. */
    readonly available = signal<BuildInfo | null>(null)

    private baseline: BuildInfo | null = null
    private timer: ReturnType<typeof setInterval> | undefined

    start(): void {
        if (this.timer) return
        this.check()
        this.timer = setInterval(() => this.check(), CHECK_INTERVAL_IN_MS)
        // A background tab's timers are throttled; check as soon as the player comes back.
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') this.check()
        })
    }

    /** Saves first, so the reload loses no progress. */
    reload(): void {
        saveGameStateNow()
        location.reload()
    }

    private async check(): Promise<void> {
        if (this.available()) return
        const info = await fetchBuildInfo()
        if (!info) return

        this.baseline ??= info
        // A version other than the bundle's means a cached page from an older deploy.
        if (info.version !== APP_VERSION || info.commit !== this.baseline.commit) {
            this.available.set(info)
            clearInterval(this.timer)
        }
    }
}

async function fetchBuildInfo(): Promise<BuildInfo | null> {
    try {
        const response = await fetch('/version.json', { cache: 'no-store' })
        if (!response.ok) return null
        const data = await response.json()
        return typeof data?.version === 'string' && typeof data?.commit === 'string'
            ? { version: data.version, commit: data.commit }
            : null
    } catch {
        return null
    }
}
