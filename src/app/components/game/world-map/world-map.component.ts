import { ChangeDetectionStrategy, Component, computed, effect, EventEmitter, inject, Output, signal } from '@angular/core'
import { LeafletModule } from '@bluehalo/ngx-leaflet'
import { I18nextPipe } from 'app/pipes/i18next.pipe'
import * as L from 'leaflet'
import { GameTab } from 'enums/ids/game-tab.enum'
import { TownsStore } from 'app/store/towns/towns.store'
import { BattleStore } from 'app/store/battle/battle.store'
import { PlayerStore } from 'app/store/player/player.store'
import { ZoneStarProgress } from 'app/store/player/zone-mastery'
import { TownMarker, WORLD_MAP_DATA, WorldMapMarker } from 'data/world-map-data'
import { ZoneID } from 'enums/ids/zone-id.enum'
import { TownID } from 'enums/map/town-id.enum'

// CRS units = source pixels. scale(z=maxZoom) = 1 (native), scale(z=0) = 1/2^maxZoom
// (whole image fits in a single tile). This keeps marker positions authorable in
// raw image-pixel coords while still using the standard z=0-is-overview pyramid.
const PIXEL_CRS: L.CRS = L.Util.extend({}, L.CRS.Simple, {
  scale: (zoom: number) => Math.pow(2, zoom - WORLD_MAP_DATA.manifest.maxZoom),
  zoom: (scale: number) => Math.log2(scale) + WORLD_MAP_DATA.manifest.maxZoom,
})

/** Modifier for a map marker's mastery star (claimed stars use the base style). */
function starModifier(progress: ZoneStarProgress): string {
  if (progress.claimed) return ''
  return progress.done ? 'map-marker__star--ready' : 'map-marker__star--empty'
}

@Component({
  selector: 'app-world-map',
  templateUrl: './world-map.component.html',
  styleUrl: './world-map.component.sass',
  imports: [LeafletModule, I18nextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorldMapComponent {
  @Output() changeTab = new EventEmitter<GameTab>()

  private readonly townsStore = inject(TownsStore)
  private readonly battleStore = inject(BattleStore)
  private readonly playerStore = inject(PlayerStore)

  private map!: L.Map
  private activeMarkers: { marker: L.Marker; minZoom: number }[] = []
  private zoneMarkerMap = new Map<ZoneID, L.Marker>()
  private townMarkerMap = new Map<TownID, L.Marker>()

  protected readonly TownID = TownID
  showTowns = signal(false)
  /** Unlocked towns that have a map marker, in marker order; stub towns and stale saved IDs have none. */
  readonly unlockedTowns = computed(() => {
    const unlocked = this.playerStore.unlockedContent().towns ?? []
    return WORLD_MAP_DATA.markers
      .filter((m): m is TownMarker => m.type === 'town')
      .map(m => m.townId)
      .filter(townId => unlocked.includes(townId))
  })

  constructor() {
    effect(() => {
      const unlockedZones = this.playerStore.unlockedContent().zones
      if (!this.map) return
      this.syncZoneMarkers(unlockedZones)
    })
    effect(() => {
      const unlockedTowns = this.playerStore.unlockedContent().towns
      if (!this.map) return
      this.syncTownMarkers(unlockedTowns)
    })
    effect(() => {
      const currentZoneId = this.battleStore.currentZoneId()
      if (!this.map) return
      this.highlightZone(currentZoneId)
    })
    effect(() => {
      this.playerStore.zoneMastery()
      if (!this.map) return
      this.showZoneStars()
    })
  }

  // center/zoom give Leaflet a valid initial view; tile layer is added later
  // (inside setTimeout) so it fires GridLayer.onAdd() only after the grid
  // has finished layout and invalidateSize() has corrected the viewport.
  readonly mapOptions: L.MapOptions = {
    crs: PIXEL_CRS,
    minZoom: WORLD_MAP_DATA.manifest.minZoom,
    maxZoom: WORLD_MAP_DATA.manifest.maxZoom,
    attributionControl: false,
    zoomControl: true,
    center: L.latLng(
      -WORLD_MAP_DATA.defaultView.center.y,
      WORLD_MAP_DATA.defaultView.center.x,
    ),
    zoom: WORLD_MAP_DATA.defaultView.zoom,
    doubleClickZoom: false,
    zoomAnimation: true,
  }

  onMapReady(map: L.Map): void {
    this.map = map
    map.on('zoomend', () => this.syncMarkerVisibility())

    setTimeout(() => {
      map.invalidateSize()

      const { width, height, tileSize, minZoom, maxZoom } = WORLD_MAP_DATA.manifest
      const bounds = L.latLngBounds(L.latLng(-height, 0), L.latLng(0, width))

      L.tileLayer(`${WORLD_MAP_DATA.tilesPath}/{z}/{x}/{y}.webp`, {
        tileSize,
        minZoom,
        maxZoom,
        bounds,
        noWrap: true,
      }).addTo(map)

      // Exactly the image: padding would let an edge zone's centering show the background past the image.
      map.setMaxBounds(bounds)
      // Open at the zoom where the image fills the panel; the default view's zoom only fits its width.
      map.setView(this.openingCenter(), map.getBoundsZoom(bounds, true), { animate: false })

      this.placeMarkers()
      this.syncMarkerVisibility()
    })
  }

  toggleTowns(): void {
    this.showTowns.update(show => !show)
  }

  openTown(townId: TownID): void {
    this.townsStore.selectTown(townId)
    this.changeTab.emit(GameTab.towns)
  }

  /** The current zone's marker, or the default view's center for a zone without one. */
  private openingCenter(): L.LatLng {
    const zoneId = this.battleStore.currentZoneId()
    const marker = WORLD_MAP_DATA.markers.find(m => m.type === 'zone' && m.zoneId === zoneId)
    const { x, y } = marker?.position ?? WORLD_MAP_DATA.defaultView.center
    return L.latLng(-y, x)
  }

  private placeMarkers(): void {
    for (const data of WORLD_MAP_DATA.markers) {
      if (data.type === 'zone') continue
      if (data.type === 'town') continue
      const marker = this.buildMarker(data)
      marker.addTo(this.map)
      this.activeMarkers.push({ marker, minZoom: data.minZoom ?? 0 })
    }
    this.syncZoneMarkers(this.playerStore.unlockedContent().zones)
    this.syncTownMarkers(this.playerStore.unlockedContent().towns)
  }

  /** Marks the zone the player is fighting in; a marker's element exists only once it's on the map. */
  private highlightZone(currentZoneId: ZoneID): void {
    for (const [zoneId, marker] of this.zoneMarkerMap) {
      marker.getElement()?.querySelector('.map-marker')?.classList.toggle('map-marker--current', zoneId === currentZoneId)
    }
  }

  /** Each zone marker's mastery stars: claimed, ready to claim (glowing), or not yet earned. */
  private showZoneStars(): void {
    const mastery = this.playerStore.zoneMastery()
    for (const [zoneId, marker] of this.zoneMarkerMap) {
      const stars = marker.getElement()?.querySelector('.map-marker__stars')
      if (stars) stars.innerHTML = mastery[zoneId].map(p => `<span class="map-marker__star ${starModifier(p)}">★</span>`).join('')
    }
  }

  private syncZoneMarkers(unlockedZones: ZoneID[]): void {
    for (const data of WORLD_MAP_DATA.markers) {
      if (data.type !== 'zone') continue
      const isUnlocked = unlockedZones.includes(data.zoneId)
      const existing = this.zoneMarkerMap.get(data.zoneId)

      if (isUnlocked && !existing) {
        const marker = this.buildMarker(data)
        marker.addTo(this.map)
        this.zoneMarkerMap.set(data.zoneId, marker)
        this.activeMarkers.push({ marker, minZoom: data.minZoom ?? 0 })
      } else if (!isUnlocked && existing) {
        existing.remove()
        this.zoneMarkerMap.delete(data.zoneId)
        this.activeMarkers = this.activeMarkers.filter(m => m.marker !== existing)
      }
    }
    this.syncMarkerVisibility()
    this.highlightZone(this.battleStore.currentZoneId())
    this.showZoneStars()
  }

  private syncTownMarkers(unlockedTowns: TownID[]): void {
    for (const data of WORLD_MAP_DATA.markers) {
      if (data.type !== 'town') continue
      const isUnlocked = unlockedTowns.includes(data.townId)
      const existing = this.townMarkerMap.get(data.townId)

      if (isUnlocked && !existing) {
        const marker = this.buildMarker(data)
        marker.addTo(this.map)
        this.townMarkerMap.set(data.townId, marker)
        this.activeMarkers.push({ marker, minZoom: data.minZoom ?? 0 })
      } else if (!isUnlocked && existing) {
        existing.remove()
        this.townMarkerMap.delete(data.townId)
        this.activeMarkers = this.activeMarkers.filter(m => m.marker !== existing)
      }
    }
    this.syncMarkerVisibility()
  }

  private buildMarker(data: WorldMapMarker): L.Marker {
    const latLng = L.latLng(-data.position.y, data.position.x)
    const icon = L.divIcon({
      html: data.type === 'zone'
        ? `<div class="map-marker map-marker--zone">${data.label}<span class="map-marker__stars"></span></div>`
        : `<div class="map-marker map-marker--${data.type}">${data.label}</div>`,
      className: '',
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    })
    const marker = L.marker(latLng, { icon })

    if (data.type === 'town') {
      marker.on('click', () => this.openTown(data.townId))
    } else if (data.type === 'zone') {
      marker.on('click', () => {
        this.battleStore.setZone(data.zoneId)
        this.changeTab.emit(GameTab.main)
      })
    } else {
      marker.bindPopup(data.i18nKey)
    }

    return marker
  }

  private syncMarkerVisibility(): void {
    const zoom = this.map.getZoom()
    for (const { marker, minZoom } of this.activeMarkers) {
      marker.setOpacity(zoom >= minZoom ? 1 : 0)
    }
    this.updateMarkerScale(zoom)
  }

  // Grow markers as the player zooms in. divIcons are fixed screen-size by
  // default; a CSS var on the container drives a scale transform in the sass.
  private updateMarkerScale(zoom: number): void {
    const { minZoom } = WORLD_MAP_DATA.manifest
    const scale = 0.6 + (zoom - minZoom) * 0.25
    this.map.getContainer().style.setProperty('--marker-scale', String(scale))
  }
}
