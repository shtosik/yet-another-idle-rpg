---
name: generate-2d-asset
description: Use when a 2D game asset — item icon, enemy sprite, NPC portrait, zone or town/building background — is missing, is a placeholder, or needs regenerating. Dispatches the asset-generator agent with a brief. Triggers on phrases like "we're missing the asset for X", "generate an icon for Y", "create an NPC portrait for Z", "regenerate the sprite for W", "we need art for this shop interior".
---

# Generate a 2D Asset

Dispatch the **`asset-generator`** agent via the `Agent` tool. It is a fresh agent, so brief it with:

- **What**: the entity and asset kind (e.g. "frost shard item icon", "blacksmith NPC portrait").
- **Where**: the ID (`ItemID.frostShard`, `NpcID.…`, `EnemyID.…`) or target path if known; otherwise say so and let it find the filename.
- **Source material**: point at the existing doc (`docs/character/**`, `docs/design/**`) instead of summarizing it.
- **Direction**: only what the user actually specified (pose, mood, distinguishing features). Do not add style words; style comes from the Style Family.
- **Size** (enemies only): the Size tier (`tiny` / `small` / `medium` / `large`) if known.

For a related set (all NPCs of a town, all enemies of a zone) send **one** brief for the whole set so it runs as one batch.

Do not generate inline: it needs a local GPU service and visual review of candidate sheets.

## After the agent returns

- Files are written but **not committed**: surface the paths, the sheet paths, any `sizeGuessed` tiers and the reference candidates it listed, then let the user review.
- Wiring a *new* entity (ID, data entry, i18n) is a separate step; use the relevant `/add-*` skill.

Done when the agent has written every requested file, you have reported the paths for review, and `npm run validate` and `npx ng build` pass (validate confirms every asset path referenced by data exists).
