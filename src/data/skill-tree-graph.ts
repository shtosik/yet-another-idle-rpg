import { ALL_SKILLS } from 'data/skill-tree-data'
import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'
import { SkillRegion } from 'enums/ids/skill-region.enum'
import { SkillPoint, SkillPointPosition, UnlockRequirement } from 'interfaces/skill-tree/skill-point.interface'

export interface SkillTreeGraph {
    nodes: ReadonlyMap<SkillPointID, SkillPoint>
    forwardEdges: ReadonlyMap<SkillPointID, ReadonlySet<SkillPointID>>
    outgoingPrereqs: ReadonlyMap<SkillPointID, ReadonlySet<SkillPointID>>
    positions: ReadonlyMap<SkillPointID, SkillPointPosition>
}

const STEP_DISTANCE = 120

// Launch angle in degrees per region. Screen y increases downward, so
// -90 points up. Symmetric 120° spread around origin.
const REGION_LAUNCH: Record<SkillRegion, number> = {
    [SkillRegion.damage]: -90,
    [SkillRegion.exploration]: 150,
    [SkillRegion.magic]: 30,
}

function collectNodeRefs(req: UnlockRequirement | null, out: Set<SkillPointID>): void {
    if (req === null) return
    switch (req.kind) {
        case 'node':
            out.add(req.id)
            return
        case 'all':
        case 'any':
            for (const child of req.of) collectNodeRefs(child, out)
            return
    }
}

function topoSort(
    nodes: Map<SkillPointID, SkillPoint>,
    outgoingPrereqs: Map<SkillPointID, Set<SkillPointID>>,
): SkillPointID[] {
    const visited = new Set<SkillPointID>()
    const result: SkillPointID[] = []

    function visit(id: SkillPointID): void {
        if (visited.has(id)) return
        visited.add(id)
        for (const prereqId of outgoingPrereqs.get(id) ?? []) {
            if (nodes.has(prereqId)) visit(prereqId)
        }
        result.push(id)
    }

    for (const id of nodes.keys()) visit(id)
    return result
}

interface ResolvedNode {
    position: SkillPointPosition
    chainDirection: number | null
}

function resolvePositions(
    nodes: Map<SkillPointID, SkillPoint>,
    outgoingPrereqs: Map<SkillPointID, Set<SkillPointID>>,
): Map<SkillPointID, SkillPointPosition> {
    const order = topoSort(nodes, outgoingPrereqs)
    const resolved = new Map<SkillPointID, ResolvedNode>()

    for (const id of order) {
        const node = nodes.get(id)
        if (!node) continue

        // 1. Explicit position pin (origin, or unconnected special nodes).
        if (node.position) {
            resolved.set(id, { position: node.position, chainDirection: null })
            continue
        }

        const prereqIds = outgoingPrereqs.get(id) ?? new Set<SkillPointID>()

        // 2. Multi-prereq: auto-midpoint of all prereqs' resolved positions.
        if (prereqIds.size > 1) {
            let sumX = 0
            let sumY = 0
            let count = 0
            for (const p of prereqIds) {
                const r = resolved.get(p)
                if (!r) continue
                sumX += r.position.x
                sumY += r.position.y
                count++
            }
            if (count === 0) {
                throw new Error(`SkillPoint ${SkillPointID[id]} has multiple prereqs but none resolved.`)
            }
            resolved.set(id, {
                position: { x: sumX / count, y: sumY / count },
                chainDirection: null,
            })
            continue
        }

        // 3. Single prereq: chain inheritance.
        if (prereqIds.size === 1) {
            const parentId = prereqIds.values().next().value as SkillPointID
            const parent = resolved.get(parentId)
            if (!parent) {
                throw new Error(`SkillPoint ${SkillPointID[id]} prereq ${SkillPointID[parentId]} not resolved.`)
            }
            const baseDirection = parent.chainDirection ?? REGION_LAUNCH[node.region]
            const direction = baseDirection + (node.turn ?? 0)
            const rad = (direction * Math.PI) / 180
            const position = {
                x: parent.position.x + Math.cos(rad) * STEP_DISTANCE,
                y: parent.position.y + Math.sin(rad) * STEP_DISTANCE,
            }
            resolved.set(id, { position, chainDirection: direction })
            continue
        }

        throw new Error(
            `SkillPoint ${SkillPointID[id]} has neither a position nor prerequisites; cannot resolve layout.`,
        )
    }

    const positions = new Map<SkillPointID, SkillPointPosition>()
    for (const [id, r] of resolved) positions.set(id, r.position)
    return positions
}

function buildGraph(): SkillTreeGraph {
    const nodes = new Map<SkillPointID, SkillPoint>()
    const forwardEdges = new Map<SkillPointID, Set<SkillPointID>>()
    const outgoingPrereqs = new Map<SkillPointID, Set<SkillPointID>>()

    for (const [idStr, node] of Object.entries(ALL_SKILLS)) {
        if (!node) continue
        nodes.set(Number(idStr) as SkillPointID, node)
    }

    for (const [id, node] of nodes) {
        const prereqs = new Set<SkillPointID>()
        collectNodeRefs(node.unlockRequirements, prereqs)
        outgoingPrereqs.set(id, prereqs)
        for (const prereqId of prereqs) {
            let dependents = forwardEdges.get(prereqId)
            if (!dependents) {
                dependents = new Set<SkillPointID>()
                forwardEdges.set(prereqId, dependents)
            }
            dependents.add(id)
        }
    }

    const positions = resolvePositions(nodes, outgoingPrereqs)

    return { nodes, forwardEdges, outgoingPrereqs, positions }
}

export const SKILL_TREE_GRAPH: SkillTreeGraph = buildGraph()
