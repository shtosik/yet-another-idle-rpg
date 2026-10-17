# Asset pipeline (`scripts/asset-gen/`)

Generated art comes from one CLI, `scripts/asset-gen/generate.mjs`. You give it a **Style Family**, a target path and a **subject** (what is depicted); the family owns everything about style. See `docs/adr/0001-pixel-art-via-ip-adapter-and-downscale.md` for why pixel art is IP-Adapter + downscale rather than a pixel LoRA.

## How a family works

A family (an entry in `styles.mjs`) is a named art recipe: checkpoint, style prompt, negative prompt, reference images, SDXL-native generation size, final target size and a post-process chain. A generation runs:

1. **References** (`lib/refs.mjs`): the family's reference images are flattened onto the family's `refBackground`, nearest-upscaled (pixel families) to 512² and fed to CLIP vision.
2. **Graph** (`lib/workflow.mjs`): checkpoint → Hyper-SDXL 8-step LoRA → IP-Adapter (style transfer from the refs, strength `ipWeight`) → KSampler (8 steps, euler, sgm_uniform) → decode → save. `--no-ref` drops the IP-Adapter branch.
3. **ComfyUI** (`lib/comfy.mjs`): the server is booted if it is not running (detached, pid recorded in `.tmp-gen/comfy.pid`) and left running between calls. `--stop` kills only the process this tool started.
4. **Post-process** (`lib/postprocess.mjs`): the family's `post` list, e.g. `keyout → trim → pixelate → outline → quantize`.
5. **Sheet** (`lib/sheet.mjs`): `.tmp-gen/<slug>/sheet.png` shows the references on top and the numbered candidates below (4× nearest for pixel families). Read it to choose.

| Family | Target | Style | Alpha |
|---|---|---|---|
| `item-pixel` | 48×48 | pixel art, like `items/cheese.png` | transparent |
| `enemy-pixel` | longer side by Size tier, natural aspect | pixel-art sprite | transparent |
| `portrait-pixel` | 256×256 | pixel-art bust, 2× chunky pixels | transparent |
| `zone-pixel` | 832×1248 | pixel-art landscape | opaque |
| `town-painterly` | 1376×768 | painterly matte | opaque |

**Size tier** (enemies): `tiny` 96, `small` 144, `medium` 192, `large` 256 px on the longer side. Pixel density is constant (2 output px per art pixel), so a smaller tier has fewer art pixels. Omitting `--tier` means `medium`, reported as `sizeGuessed: true`.

## CLI reference

```
generate --family <id> --target <path> --subject "<text>" [--count 4] [--seed N] [--no-ref] [--tier tiny|small|medium|large]
generate --pick <n> --slug <slug>            copy candidate n to its target and record it in manifest.json
generate --batch jobs.json                   [{family,target,subject,count?,seed?,tier?,tag?,noRef?}], one server boot
generate --estimate-hue <base target>        estimate shinyHue from the existing base + -shiny pair (run BEFORE regenerating)
generate --shiny-of <base target> [--hue N]  write <name>-shiny.png beside the base (hue-shifted)
generate --list-families | --stop
tuning:  --steps --cfg --sampler --ip-weight --grid --colors --tag <suffix> --keep-raw
```

Run as `node scripts/asset-gen/generate.mjs …`. Progress goes to stderr, a JSON result to stdout (`slug`, `seed`, `candidates`, `sheet`, `seconds`, `tier`, `sizeGuessed`). Candidates are written to `.tmp-gen/<slug>/` (gitignored); `--pick` writes the final file. Redo = same target with a new `--seed` or an edited subject; `--pick` overwrites the manifest entry.

`scripts/asset-gen/manifest.json` (tracked) maps target → `{family, tier, subject, seed, date}` plus `shinyHue` for enemies. Targets under `.tmp-gen/` are never recorded.

## Writing a subject

Content only: the thing, its pose or scene, distinguishing features. Never style words (pixel art, outline, palette, background colour). Avoid naming creatures when you want an object (`gnoll` made the model draw gnolls; describe the object).

## Add or tune a family

1. Add the family to `FAMILIES` in `styles.mjs` and its final size to `FAMILY_TARGETS` (validated at load: refs must exist, target must match).
2. Pick 3–6 references that are real, distinct art. Exclude placeholder duplicates: `items/` files byte-identical to `apple.png`, and the 13 enemy sprites that are copies of one placeholder.
3. Run a live sheet into a scratch target (e.g. `.tmp-gen/scratch/x.png`) and compare against the references. Use `--tag` for A/B variants (`--no-ref`, `--ip-weight`, `--steps`) and `--keep-raw` to see the unprocessed generation.
4. Tune in the registry entry. Known levers: `ipWeight` (higher pulls colour toward the reference background), `refBackground` (match the prompted keyout background; green tinted subjects, light grey works), `grid`/`colors` in `post`, `sampler`.
5. Add a test in `scripts/asset-gen/test/` for any new post-process step or sizing rule.

## Shinies

Shiny sprites are separate hue-shifted files at `<name>-shiny.png` (the runtime derives the path with `toShinyUrl`). Before regenerating a legacy enemy run `--estimate-hue` on it (the legacy base/shiny pair is the only source of the angle); afterwards `--shiny-of` applies the stored angle, or `--hue N` overrides it.

## Tests

`npm run test:assets` (node:test, no GPU needed): post-process steps, graph builder, ComfyUI adapter against a fake http/ws server, registry validation, tiers, batch and manifest, shiny.
