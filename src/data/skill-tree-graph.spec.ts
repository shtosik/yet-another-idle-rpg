import { SKILL_TREE_GRAPH } from './skill-tree-graph'
import { SkillNodeID } from '../enums/ids/skill-node-id.enum'

/** Node icons are 80 px wide (`skill-tree.component.ts`); centres closer than that overlap. */
const ICON_SIZE = 80

describe('SKILL_TREE_GRAPH layout', () => {
  it('places no two nodes on top of each other', () => {
    const entries = [...SKILL_TREE_GRAPH.positions]
    const overlaps: string[] = []
    entries.forEach(([idA, a], i) => {
      for (const [idB, b] of entries.slice(i + 1)) {
        if (Math.hypot(a.x - b.x, a.y - b.y) < ICON_SIZE) overlaps.push(`${SkillNodeID[idA]} / ${SkillNodeID[idB]}`)
      }
    })

    expect(overlaps).toEqual([])
  })
})
