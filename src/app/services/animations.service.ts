import { Injectable, signal } from '@angular/core'

export interface DamageEvent {
    damage: number;
    isCriticalHit?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AnimationsService {
    damageEvent = signal<DamageEvent>(null)

    showDamage(damage: number, isCriticalHit: boolean = false) {
        this.damageEvent.set({ damage, isCriticalHit })
    }
}
