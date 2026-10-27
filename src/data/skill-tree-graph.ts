import { ALL_SKILLS } from 'data/skill-tree-data'
import { SkillNodeID } from 'enums/ids/skill-node-id.enum'
import { SkillBranch } from 'enums/ids/skill-branch.enum'
import { SkillNode, SkillNodePosition, NodeRequirement } from 'interfaces/skill-tree/skill-node.interface'

export interface SkillTreeGraph {
    nodes: ReadonlyMap<SkillNodeID, SkillNode>
    forwardEdges: ReadonlyMap<SkillNodeID, ReadonlySet<SkillNodeID>>
    outgoingPrereqs: ReadonlyMap<SkillNodeID, ReadonlySet<SkillNodeID>>
    /** Lines the tree draws, parent to child: the requirements, or the node's `anchor` instead. */
    drawnEdges: ReadonlyMap<SkillNodeID, ReadonlySet<SkillNodeID>>
    positions: ReadonlyMap<SkillNodeID, SkillNodePosition>
}

const STEP_DISTANCE = 120

// Launch angle in degrees per branch. Screen y increases downward, so
// -90 points up. Symmetric 120° spread around origin; the element branches fan
// across the magic sector, leaving 30° free for the shared magic core.
const BRANCH_LAUNCH: Record<SkillBranch, number> = {
    [SkillBranch.damage]: -90,
    [SkillBranch.exploration]: 150,
    [SkillBranch.magic]: 30,
    [SkillBranch.fire]: -25,
    [SkillBranch.water]: 5,
    [SkillBranch.air]: 55,
    [SkillBranch.earth]: 85,
}

function collectNodeRefs(req: NodeRequirement | null, out: Set<SkillNodeID>): void {
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
    nodes: Map<SkillNodeID, SkillNode>,
    outgoingPrereqs: Map<SkillNodeID, Set<SkillNodeID>>,
): SkillNodeID[] {
    const visited = new Set<SkillNodeID>()
    const result: SkillNodeID[] = []

    function visit(id: SkillNodeID): void {
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
    position: SkillNodePosition
    chainDirection: number | null
}

function resolvePositions(
    nodes: Map<SkillNodeID, SkillNode>,
    outgoingPrereqs: Map<SkillNodeID, Set<SkillNodeID>>,
): Map<SkillNodeID, SkillNodePosition> {
    const order = topoSort(nodes, outgoingPrereqs)
    const resolved = new Map<SkillNodeID, ResolvedNode>()

    for (const id of order) {
        const node = nodes.get(id)
        if (!node) continue

        // 1. Explicit position pin (origin, or unconnected special nodes).
        if (node.position) {
            resolved.set(id, { position: node.position, chainDirection: null })
            continue
        }

        const prereqIds = outgoingPrereqs.get(id) ?? new Set<SkillNodeID>()

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
                throw new Error(`SkillNode ${SkillNodeID[id]} has multiple prereqs but none resolved.`)
            }
            resolved.set(id, {
                position: { x: sumX / count, y: sumY / count },
                chainDirection: null,
            })
            continue
        }

        // 3. Single prereq: chain inheritance.
        if (prereqIds.size === 1) {
            const parentId = prereqIds.values().next().value as SkillNodeID
            const parent = resolved.get(parentId)
            if (!parent) {
                throw new Error(`SkillNode ${SkillNodeID[id]} prereq ${SkillNodeID[parentId]} not resolved.`)
            }
            const baseDirection = parent.chainDirection ?? BRANCH_LAUNCH[node.branch]
            const direction = baseDirection + (node.turn ?? 0)
            const rad = (direction * Math.PI) / 180
            const step = STEP_DISTANCE * (node.distance ?? 1)
            const position = {
                x: parent.position.x + Math.cos(rad) * step,
                y: parent.position.y + Math.sin(rad) * step,
            }
            resolved.set(id, { position, chainDirection: direction })
            continue
        }

        throw new Error(
            `SkillNode ${SkillNodeID[id]} has neither a position nor prerequisites; cannot resolve layout.`,
        )
    }

    const positions = new Map<SkillNodeID, SkillNodePosition>()
    for (const [id, r] of resolved) positions.set(id, r.position)
    return positions
}

function buildGraph(): SkillTreeGraph {
    const nodes = new Map<SkillNodeID, SkillNode>()
    const forwardEdges = new Map<SkillNodeID, Set<SkillNodeID>>()
    const outgoingPrereqs = new Map<SkillNodeID, Set<SkillNodeID>>()
    const layoutParents = new Map<SkillNodeID, Set<SkillNodeID>>()
    const drawnEdges = new Map<SkillNodeID, Set<SkillNodeID>>()
    const addEdge = (edges: Map<SkillNodeID, Set<SkillNodeID>>, from: SkillNodeID, to: SkillNodeID) => {
        const dependents = edges.get(from) ?? new Set<SkillNodeID>()
        dependents.add(to)
        edges.set(from, dependents)
    }

    for (const [idStr, node] of Object.entries(ALL_SKILLS)) {
        if (!node) continue
        nodes.set(Number(idStr) as SkillNodeID, node)
    }

    for (const [id, node] of nodes) {
        const prereqs = new Set<SkillNodeID>()
        collectNodeRefs(node.requires, prereqs)
        outgoingPrereqs.set(id, prereqs)
        for (const prereqId of prereqs) addEdge(forwardEdges, prereqId, id)

        const parents = node.anchor !== undefined ? new Set([node.anchor]) : prereqs
        layoutParents.set(id, parents)
        for (const parentId of parents) addEdge(drawnEdges, parentId, id)
    }

    const positions = resolvePositions(nodes, layoutParents)

    return { nodes, forwardEdges, outgoingPrereqs, drawnEdges, positions }
}

export const SKILL_TREE_GRAPH: SkillTreeGraph = buildGraph()
