import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core'
import { LeafletModule } from '@bluehalo/ngx-leaflet'
import * as L from 'leaflet'
import i18next from 'i18next'
import { SKILL_TREE_GRAPH } from 'data/skill-tree-graph'
import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'
import { SkillRegion } from 'enums/ids/skill-region.enum'
import { SkillPoint } from 'interfaces/skill-tree/skill-point.interface'
import { PlayerManagerService } from 'app/services/player-manager.service'
import { ModalService } from 'app/services/modal.service'
import { isRequirementMet } from 'utils/skill-tree-requirements'
import { TranslatePipe } from 'app/pipes/i18next.pipe'

type NodeState = 'allocated' | 'available' | 'locked' | 'maxed'

const EDGE_STYLE: Record<'locked' | 'available' | 'allocated', { color: string; opacity: number; weight: number }> = {
  locked: { color: '#444', opacity: 0.4, weight: 2 },
  available: { color: '#8aa8c8', opacity: 0.75, weight: 3 },
  allocated: { color: '#ffd27a', opacity: 0.95, weight: 4 },
}

@Component({
  selector: 'app-skill-tree',
  templateUrl: 'skill-tree.component.html',
  styleUrl: './skill-tree.component.sass',
  imports: [LeafletModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillTreeComponent {
  private readonly playerManagerService = inject(PlayerManagerService)
  private readonly modalService = inject(ModalService)
  private readonly unlockedSkillPoints = this.playerManagerService.unlockedSkillPoints

  private map!: L.Map
  private readonly markersById = new Map<SkillPointID, L.Marker>()
  private readonly edges: Array<{ to: SkillPointID; polyline: L.Polyline }> = []

  readonly mapOptions: L.MapOptions = {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 1,
    attributionControl: false,
    zoomControl: true,
    center: L.latLng(-400, 700),
    zoom: -1,
    doubleClickZoom: false,
    zoomAnimation: true,
  }

  constructor() {
    effect(() => {
      const unlocked = this.unlockedSkillPoints()
      if (!this.map) return
      this.refresh(unlocked)
    })
  }

  onMapReady(map: L.Map): void {
    this.map = map
    setTimeout(() => {
      map.invalidateSize()
      this.placeMarkers()
      this.placeEdges()
      this.refresh(this.unlockedSkillPoints())
    })
  }

  private placeMarkers(): void {
    for (const node of SKILL_TREE_GRAPH.nodes.values()) {
      const pos = SKILL_TREE_GRAPH.positions.get(node.id)!
      const marker = L.marker(L.latLng(-pos.y, pos.x), {
        icon: this.buildIcon(node, 0, 'locked'),
      })
      marker.on('click', (ev) => {
        const orig = ev.originalEvent as MouseEvent
        this.playerManagerService.buySkillPoint(node.id, orig.ctrlKey)
      })
      marker.on('contextmenu', (ev) => {
        const orig = ev.originalEvent as MouseEvent
        orig.preventDefault()
        this.playerManagerService.refundSkillPoint(node.id, orig.ctrlKey ? 'all' : 1)
      })
      marker.bindTooltip(this.buildTooltip(node, 0, 'locked'), {
        direction: 'right',
        offset: L.point(45, 0),
        className: 'skill-tooltip',
        sticky: false,
      })
      marker.addTo(this.map)
      this.markersById.set(node.id, marker)
    }
  }

  private placeEdges(): void {
    const edgeGroup = L.layerGroup().addTo(this.map)
    for (const [fromId, dependents] of SKILL_TREE_GRAPH.forwardEdges) {
      const fromPos = SKILL_TREE_GRAPH.positions.get(fromId)
      if (!fromPos) continue
      for (const toId of dependents) {
        const toPos = SKILL_TREE_GRAPH.positions.get(toId)
        if (!toPos) continue
        const polyline = L.polyline(
          [
            L.latLng(-fromPos.y, fromPos.x),
            L.latLng(-toPos.y, toPos.x),
          ],
          { ...EDGE_STYLE.locked, interactive: false },
        )
        polyline.addTo(edgeGroup)
        this.edges.push({ to: toId, polyline })
      }
    }
  }

  private refresh(unlocked: Readonly<Record<number, number>>): void {
    const stateById = new Map<SkillPointID, NodeState>()
    for (const node of SKILL_TREE_GRAPH.nodes.values()) {
      const level = unlocked[node.id] ?? 0
      let state: NodeState
      if (level >= node.maxLevel) state = 'maxed'
      else if (level > 0) state = 'allocated'
      else if (isRequirementMet(node.unlockRequirements, unlocked))
        state = 'available'
      else state = 'locked'
      stateById.set(node.id, state)

      const marker = this.markersById.get(node.id)
      if (marker) {
        marker.setIcon(this.buildIcon(node, level, state))
        marker.setTooltipContent(this.buildTooltip(node, level, state))
      }
    }

    for (const edge of this.edges) {
      const toState = stateById.get(edge.to)
      const styleKey: 'locked' | 'available' | 'allocated' =
        (toState === 'allocated' || toState === 'maxed') ? 'allocated'
          : (toState === 'available') ? 'available'
            : 'locked'
      edge.polyline.setStyle(EDGE_STYLE[styleKey])
    }
  }

  private buildIcon(node: SkillPoint, level: number, state: NodeState): L.DivIcon {
    const region = SkillRegion[node.region]
    const special = node.special ? ' skill-node--special' : ''
    return L.divIcon({
      html: `
                <div class="skill-node skill-node--${state} skill-node--${region}${special}"
                     style="background-image: url('${node.url}')">
                    <div class="skill-node__info">
                        <span>${level} / ${node.maxLevel}</span>
                        <span>${node.skillPointCost} SP</span>
                    </div>
                </div>
            `,
      className: '',
      iconSize: [80, 80],
      iconAnchor: [40, 40],
    })
  }

  private buildTooltip(node: SkillPoint, level: number, state: NodeState): string {
    const idName = SkillPointID[node.id]
    const name = i18next.t(`skill-tree:skillPoints.${idName}.name`)
    const desc = i18next.t(`skill-tree:skillPoints.${idName}.desc`)
    const cost = i18next.t('skill-tree:cost', { amount: node.skillPointCost })
    const hint = i18next.t('skill-tree:add')
    const lockBadge = state === 'locked'
      ? `<div class="skill-tooltip__locked">Locked</div>`
      : ''

    let refundLine = ''
    if (level > 0) {
      const check = this.playerManagerService.previewRefund(node.id, 1)
      if (check.ok) {
        const goldCost = this.playerManagerService.refundGoldCost(check.pointsReturned)
        refundLine = `<div class="skill-tooltip__refund">Right-click: refund 1 (${goldCost} gold)</div>`
      } else if ('reason' in check && check.reason === 'blocked-by') {
        const blockerNames = check.blockers
          .map(id => i18next.t(`skill-tree:skillPoints.${SkillPointID[id]}.name`))
          .join(', ')
        refundLine = `<div class="skill-tooltip__refund skill-tooltip__refund--blocked">Refund blocked by: ${blockerNames}</div>`
      }
    }

    return `
            <div class="skill-tooltip__body">
                <div class="skill-tooltip__name">${name}</div>
                <div class="skill-tooltip__desc">${desc}</div>
                <div class="skill-tooltip__meta">${level} / ${node.maxLevel} &middot; ${cost}</div>
                ${lockBadge}
                ${refundLine}
                <div class="skill-tooltip__hint">${hint}</div>
            </div>
        `
  }

  openResetConfirm(): void {
    this.modalService.openRespecConfirm()
  }
}
