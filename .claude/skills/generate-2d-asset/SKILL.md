---
name: generate-2d-asset
description: Use when a 2D game asset — item icon, NPC portrait, enemy sprite, or a town/building background — is missing, is a placeholder, or needs regenerating. Routes the work to the local ComfyUI/SDXL pipeline. Triggers on phrases like "we're missing the asset for X", "generate an icon for Y", "create an NPC portrait for Z", "regenerate the sprite for W", "generate the background for this building", "we need art for this shop interior".
---

# Generate a 2D Asset

Image generation runs against the local ComfyUI/SDXL install bundled with the Krita AI
Diffusion plugin (`%APPDATA%\krita\ai_diffusion\server\ComfyUI`) — no external API, no
cost. It's a multi-step job (boot the server, build a prompt from the existing art
style, generate a batch, review candidates as images, post-process to match the sibling
asset exactly) that belongs in its own context rather than inline in the main
conversation.

## Which agent to dispatch

Two agents split this by asset shape — pick the one that matches:

- **`asset-generator`** — small, usually-transparent assets: item icons, NPC/enemy
  portraits, sprites. Involves silhouette masking.
- **`background-generator`** — large, always-opaque full-bleed scenes: building
  interiors/exteriors, town skylines. No masking step, much bigger canvas.

If genuinely unsure which one a request is (rare), check whether the target lives under
`src/assets/img/backgrounds/` (→ `background-generator`) or `img/items|avatars|enemies|...`
(→ `asset-generator`).

## What to do

Dispatch the chosen subagent via the `Agent` tool — it's a fresh agent, so brief it
fully:

- The entity/asset needed (e.g. "air rune item icon", "blacksmith NPC portrait",
  "apothecary interior background").
- Its ID if known (`ItemID.airRune`, a `TownBuildingID`, etc.) so it can confirm the
  exact expected filename — if you don't know the ID, say so and let the agent find it.
- Where you'd expect the file to live if you know the convention — otherwise the agent
  will locate the right directory and sibling assets itself.
- Any design doc that already exists for this entity (e.g. `docs/character/**`) — point
  the agent at it directly rather than summarizing it yourself, so it gets the full
  brief verbatim.
- Any specific visual direction the user gave (color, pose, mood). If the user didn't
  specify and no doc covers it, tell the agent to infer style purely from sibling
  assets — don't invent direction it wasn't given.

For a batch of related assets (e.g. all NPCs in one town, all buildings in one town),
dispatch **one** call covering the whole batch rather than one call per asset — the
agent can share its ComfyUI boot and style/checkpoint decision across the set instead of
redoing setup each time, and the result reads as a consistent set.

Do not attempt the generation inline: it needs `Bash` access to a local GPU service,
several rounds of polling, and visual review of multiple candidate images, none of which
should occupy the main conversation's context.

## After the agent returns

- The asset is written to disk but **not committed** — surface the path(s) changed and
  let the user review (`git status` / `git diff --stat`) before committing.
- If the request also implies wiring a *new* entity (new `ItemID`/`TownBuildingID`, new
  data entry, i18n, drop tables, …), that's a separate step — use the relevant `/add-*`
  skill for that. Neither generator agent wires game data, only the image file.
