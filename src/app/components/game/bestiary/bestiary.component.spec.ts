import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { EnemyID } from '../../../../enums/ids/enemy-id.enum'
import { ZoneID } from '../../../../enums/ids/zone-id.enum'
import { PlayerStore } from '../../../store/player/player.store'
import { BestiaryComponent } from './bestiary.component'

describe('BestiaryComponent', () => {
  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
  })

  afterEach(() => localStorage.clear())

  const goatZones = () => {
    const bestiary = TestBed.createComponent(BestiaryComponent).componentInstance
    return bestiary.monsters().find(m => m.id === EnemyID.goat)!.zones
  }

  it('names a hidden Zone in "Found in" only once it is unlocked', () => {
    const player = TestBed.inject(PlayerStore)
    player.applyUnlockTarget({ type: 'zone', zoneId: ZoneID.mountainPass })
    expect(goatZones()).toEqual([ZoneID.mountainPass])

    player.applyUnlockTarget({ type: 'zone', zoneId: ZoneID.goatCleft })
    expect(goatZones()).toEqual([ZoneID.mountainPass, ZoneID.goatCleft])
  })
})
