> **Archived 2026-10-21: superseded by [docs/systems/asset-pipeline.md](../systems/asset-pipeline.md).** Historical plan or analysis, not current behavior.

# Asset pipeline rework: `generate` module + Style Family registry

## Context

Asset generation (`asset-generator` / `background-generator` agents, `/generate-2d-asset` skill) is slow and output often misses the game's style. Architecture review found:

- **Slow**: the pipeline is prose. Every run the agent re-derives server boot, checkpoint, dims, workflow JSON fill, curl poll loop (one LLM turn per poll), copy-script-to-`.tmp-gen` dance, post-process. Sampler runs plain txt2img at 30 steps.
- **Off-style**: text is the only style signal. Installed but unused: `ComfyUI_IPAdapter_plus` + `ip-adapter_sdxl_vit-h` + `clip-vision_vit-h`, `Hyper-SDXL-8steps-CFG-lora`. References picked by directory, but directories mix styles. Lanczos downscale of a 1024² painting can never produce pixel art.

Decisions from user:

| Style Family | Target size | Style | Alpha |
|---|---|---|---|
| `item-pixel` | 48×48 | pixel art (like `items/apple.png`) | transparent |
| `enemy-pixel` | ≤256 on the longer side, by **Size tier** (`tiny` 96, `small` 144, `medium` 192, `large` 256), natural aspect, no square padding | pixel-art sprite (like `enemies/bandit.png`, bigger) | transparent |
| `portrait-pixel` | 256×256 | pixel-art bust — **not** the Corwin ink style | transparent |
| `zone-pixel` | 832×1248 | pixel-art landscape (like `backgrounds/plains-vertical.png`) | opaque |
| `town-painterly` | 1376×768 | painterly matte (like `backgrounds/mawood.png`) | opaque |

Merge the two agents into one. Phased rollout, prove on `item-pixel` first. Script leaves ComfyUI running between calls; the agent runs `--stop` at the end of every task (frees VRAM).

### Decisions from design review

- **Size tier**: enemy size comes from lore / enemy description / originating task. No hint → default `medium`, flagged "size guessed" in the report (never blocks). 256 is a hard cap; pixel density is constant across tiers (smaller tier = fewer art pixels). Tier is recorded in the manifest. Defined in `CONTEXT.md`.
- **Pixel density**: new enemy art-pixel size matches legacy sprites (grid derived from that, tuned in phase 2), not a finer one.
- **Non-blocking agent**: agent picks the candidate itself (≤1 re-roll), reports path + sheet path, never waits on user review. User reviews after the whole task and asks for redos. Reference-worthy results are listed in the final report; user approves adding them afterwards.
- **Manifest**: tracked `scripts/asset-gen/manifest.json`, target → `{family, tier, subject, seed, date}`. `--pick` writes the entry. Redo = same entry, new seed or edited subject.
- **Shinies**: shiny sprites are separate hue-edited files at `<name>-shiny.png` next to the base (runtime derives the path). `generate --shiny-of <base target>` hue-shifts the accepted base via sharp `modulate({hue})` with a per-enemy angle (estimated from the legacy base/shiny pair, stored in the manifest, overridable).
- **Checkpoints**: picked from what is installed per family; if none suits pixel art, phase 1 uses base checkpoint + IP-Adapter and flags it.
- **ADR**: `docs/adr/0001-pixel-art-via-ip-adapter-and-downscale.md`.

## Target shape

One deep module, `scripts/asset-gen/generate.mjs`. Interface = **family + target + subject**, then **pick**. Agent supplies only subject content and judgment; everything mechanical sits behind the seam.

```
node scripts/asset-gen/generate.mjs --family item-pixel --target src/assets/img/items/frostShard.png \
     --subject "a jagged pale-blue ice crystal shard" [--count 4] [--seed N] [--no-ref]
  -> .tmp-gen/<slug>/candidate-1..4.png (already post-processed to target size)
  -> .tmp-gen/<slug>/sheet.png (references + candidates, pixel families also at 4x nearest)
  -> stdout JSON {slug, seed, candidates[], sheet, seconds}
node scripts/asset-gen/generate.mjs --pick 3 --slug <slug>     # writes candidate to its target
node scripts/asset-gen/generate.mjs --batch jobs.json           # [{family,target,subject}], one boot
node scripts/asset-gen/generate.mjs --list-families | --stop
```

### Files (all under `scripts/asset-gen/`)

- `generate.mjs` — CLI parse + orchestration only.
- `styles.mjs` — **Style Family registry** (JS for comments). Per family: `checkpoint`, `stylePrompt`, `negative`, `references[]` (repo paths), `gen: [w,h]` (SDXL-native), `target: [w,h]`, `post: [...]` step list with params, `sampler` overrides, `ipWeight`. Validated at load (refs exist, target matches table above).
- `lib/comfy.mjs` — ComfyUI adapter: `ensureServer()` (probe `/system_stats`; else spawn `%APPDATA%\krita\ai_diffusion\server\venv\Scripts\python.exe main.py --port 8188` detached, write `.tmp-gen/comfy.pid`, poll ≤120 s), `run(graph) -> Buffer[]` (POST `/prompt`, await completion via Node 22 global `WebSocket` on `/ws?clientId=`, fallback to `/history` poll, fetch `/view`), `stop()` (kills only the pid it wrote). Checkpoint name verified against `/object_info/CheckpointLoaderSimple`, clear error if missing.
- `lib/workflow.mjs` — pure `buildGraph({family, subject, seed, refsBase64, count, useRef})` returning a graph object (no string templating). Graph: `CheckpointLoaderSimple` → `LoraLoader` (Hyper-SDXL 8-step) → `IPAdapterAdvanced` (`IPAdapterModelLoader` + `CLIPVisionLoader`, refs via Krita's `ETN_LoadImageBase64` + `ImageBatch`, `weight_type: "style transfer"`, `combine_embeds: "average"`) → `KSampler` (8 steps, cfg ~5-6, euler/sgm_uniform — tune in phase 1) → `VAEDecode` → `SaveImage`. `--no-ref` drops the IP-Adapter branch (A/B).
- `lib/postprocess.mjs` — pure `Buffer -> Buffer` steps on `sharp` (already a dep, `^0.34.5`): `keyout` (port of existing `keyout.mjs` BFS as a function — keep its no-`.blur()`-on-raw rule), `trim`, `pixelate({grid})` (area-average down to grid, nearest up to target), `quantize({colors})` (sharp `png({palette:true, colours})`), `outline({px, color})` (dark 1px edge from alpha), `cover` (port of `resize-cover.mjs`), `fit`. Family `post` lists compose these.
- `lib/refs.mjs` — load family refs, nearest-upscale small pixel refs to 512² for CLIP vision, base64.
- `lib/sheet.mjs` — contact sheet: refs row + candidates row at target size (+4× nearest for pixel families), numbered.
- `test/*.test.mjs` — `node:test`; npm script `"test:assets": "node --test scripts/asset-gen/test/"`.
- Delete after phase 3: `workflow-icon.json`, `workflow-background.json`, `keyout.mjs`, `resize-cover.mjs` (absorbed).

### Family post chains (starting points, tune in phases)

- `item-pixel`: gen 1024² → `keyout` → `trim` → `pixelate{grid:48}` → `quantize{16}` → `outline{1}`.
- `enemy-pixel`: gen 1024² → `keyout` → `trim` → `fit` to tier longer side → `pixelate{grid}` (grid so art-pixel size ≈ legacy sprites, tune in phase 2) → `quantize{32}` → `outline{1}`.
- `portrait-pixel` (fixed 256×256): gen 1024² → `keyout` → `trim` → `pixelate{grid:128}` (2× chunky pixels) → `quantize{32}` → `outline{1}` → `fit 256`.
- `zone-pixel`: gen 832×1216 → `cover 832×1248` → `pixelate{block:4}` → `quantize{48}`.
- `town-painterly`: gen 1344×768 → `cover 1376×768`.

References: `item-pixel` ← real pixel items (check each is not a placeholder copy; e.g. `items/blightedFetish.png` is a duplicate of `apple.png` — exclude dupes). `enemy-pixel` ← `bandit`, `gnarledTreant`, other 69×113 sprites. `portrait-pixel` has no pixel portraits yet → bootstrap from `enemy-pixel` refs; first accepted portraits get added as its refs. `zone-pixel` ← the three `*-vertical.png`. `town-painterly` ← `mawood.png`, `mawoodApothecary.png`, `laHarparTavern.png`.

## Phases

### Phase 1 — core module, prove on `item-pixel`
1. Write `lib/comfy.mjs`, `lib/workflow.mjs`, `lib/postprocess.mjs`, `lib/refs.mjs`, `lib/sheet.mjs`, `styles.mjs` (only `item-pixel` populated), `generate.mjs`.
2. Tests: postprocess on synthetic buffers (keyout removes solid bg around square; pixelate gives exact dims and ≤N colors; outline only touches alpha-edge pixels); `buildGraph` structure per family and `--no-ref`; registry validation; comfy adapter against a fake `node:http` + ws server (submit → complete → fetch).
3. Live A/B: regenerate 2-3 existing items to `.tmp-gen/` targets with and without `--no-ref`; also 30 vs 8 steps. Tune `ipWeight`, cfg, grid, colors in the registry entry. Record timings.
4. Gate: user reviews sheets, approves item style before phase 2 (the only blocking review; after phase 3 nothing blocks on user).
5. `npm i` first (`node_modules` absent locally, `sharp` needed).
6. **UI change, ship right after phase 1**: battle (`enemy.component.html`, currently fixed 128×128 stretch) and bestiary (`.bestiary__sprite`) render sprites at intrinsic size ÷ 2, `object-fit: contain`, bottom-aligned container. Legacy 69×113 sprites will look small until phase 4 — accepted.

### Phase 2 — remaining families
Add `enemy-pixel`, `portrait-pixel`, `zone-pixel`, `town-painterly` entries; same live check per family (one existing subject each, written to `.tmp-gen/`). Add `--batch`, the manifest, and `--shiny-of`.

### Phase 3 — agents, skill, docs
- Rewrite `.claude/agents/asset-generator.md` (~60 lines): map request to family + target (table above; confirm filename by grepping enum / `towns-data.ts` `url:` as today), write **subject only** (content, pose, scene from `docs/character/**` / `docs/design/**` brief — never style words; style is the family's job), run `generate`, `Read` `sheet.png`, pick or one re-roll (seed/subject tweak), `--pick`, report path, never commit. List excellent results in the final report as reference candidates (user approves adding them later; never blocks). Size tier from lore/description/task, default `medium` flagged. Run `--stop` at task end. Effort budget: ≤2 rounds per asset; if no family fits, report and skip rather than improvise.
- Delete `.claude/agents/background-generator.md`. Slim `.claude/skills/generate-2d-asset/SKILL.md` to brief template, no routing.
- Replace `docs/analysis/asset-pipeline-shared.md` with `docs/analysis/asset-pipeline.md`: how families work, how to add/tune one, CLI reference.
- Update `CLAUDE.md` (agents list, `npm run test:assets`), `CONTEXT.md` (add **Style Family**: named art recipe — size, style, references, post-process — every generated asset belongs to exactly one).

### Phase 4 — regenerate legacy assets
Regenerate all legacy enemies (62, plus their `-shiny.png` via `--shiny-of`) and avatars (Corwin-ink → `portrait-pixel`), one batch per family. Legacy files are used as references; sizes may change (tier from lore, e.g. crab is currently drawn bigger than a troll). Items are already 48×48 pixel art: only regenerate placeholder duplicates (e.g. `blightedFetish`). Backgrounds untouched. Agent never blocks; user reviews afterwards and requests redos.

## Verification

- `npm run test:assets` green.
- Cold run (`--stop` first): server boots, batch of 4 `item-pixel` returns sheet; record wall time. Warm run target: well under 1 minute per batch of 4 for 48×48 (vs current multi-minute agent loop).
- Output checks: exact target dims, alpha present for transparent families / fully opaque for backgrounds, `item-pixel` colour count ≤ palette, sheet shows candidates next to refs.
- A/B sheets (`--no-ref` vs ref-conditioned) reviewed by user per family.
- Phase 3: dispatch merged `asset-generator` on a real missing/placeholder asset (e.g. `items/blightedFetish.png`) end-to-end; confirm it never writes style prose, makes ≤2 generate calls, leaves file uncommitted.
- `npm run build` unaffected (scripts outside `src/`).

## Out of scope / follow-ups
- Pixel-art-specialised SDXL LoRA download — revisit only if IP-Adapter + pixelate isn't enough after phase 1.
- (Legacy regeneration is now Phase 4, not out of scope.)
