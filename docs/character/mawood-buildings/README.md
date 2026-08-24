# Mawood Buildings

Purpose, atmosphere, and background-art briefs for Mawood's town buildings, from `src/data/towns-data.ts` + `docs/design/mawood-and-elderwood-zones.md`.

- [Elder Tree](elder-tree.md) — town center, Corwin
- [Apothecary](apothecary.md) — Sylvie's shop, hollowed-trunk interior
- [Hunter Lodge](hunter-lodge.md) — shared by Finn and Brenna, split workshop
- [Magic Shop](magic-shop.md) — Elarion's shop, arcane-veined heartwood
- [High Platform](high-platform.md) — Milo's perch, open-sky contrast

Two more building entries exist with no background/NPC yet — pure zone-entrance gates, not settings to render:
- `deepwoodEntrance` (opens after Corwin's `theSapThatBurns` quest)
- `upperCanopyEntrance` (opens after Milo's `feathersForAKite` quest)

## Status

All five real buildings currently share one placeholder background — `mawoodElderTree.png`, `mawoodApothecary.png`, `mawoodHunterLodge.png`, `mawoodMagicShop.png`, and `mawoodHighPlatform.png` all point at the same inherited La Harpar dock/tavern art. Only the town overview (`mawood.png`) has real distinct art (the vertical treehouse skyline). Asset generation for Mawood is in progress. See [character notes](../mawood/README.md) for matching NPC portrait briefs and the shared lighting rule (twilight/bioluminescent moss except High Platform's open sky).
