import { Injectable } from '@angular/core'
import { Subject } from 'rxjs'

export interface DamageEvent {
    damage: number;
    isCriticalHit?: boolean;
    isStrong?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AnimationsService {
    // A stream, not a signal: several hits in one tick must each reach the popup.
    private readonly damageEvents = new Subject<DamageEvent>()
    readonly damageEvents$ = this.damageEvents.asObservable()

    showDamage(damage: number, isCriticalHit: boolean = false, isStrong: boolean = false) {
        this.damageEvents.next({ damage, isCriticalHit, isStrong })
    }
}
