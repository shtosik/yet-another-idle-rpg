# Asset pipeline (`scripts/asset-gen/`)

Generated art comes from one CLI, `scripts/asset-gen/generate.mjs`. You give it a **Style Family**, a target path and a **subject** (what is depicted); the family owns everything about style. See `docs/adr/0001-pixel-art-via-ip-adapter-and-downscale.md` for why pixel art is IP-Adapter + downscale rather than a pixel LoRA.

## How a family works

A family (an entry in `styles.mjs`) is a named art recipe: checkpoint, style prompt, negative prompt, reference images, SDXL-native generation size, final target size and a post-process chain. A generation runs:

1. **References** (`lib/refs.mjs`): the family's reference images are flattened onto the family's `refBackground`, nearest-upscaled (pixel families) to 512² and fed to CLIP vision.
2. **Graph** (`lib/workflow.mjs`): checkpoint → Hyper-SDXL 8-step LoRA → IP-Adapter (style transfer from the refs, strength `ipWeight`) → KSampler (8 steps, euler, sgm_uniform) → decode → save. `--no-ref` drops the IP-Adapter branch.
3. **ComfyUI** (`lib/comfy.mjs`): the server is booted if it is not running (detached, pid recorded in `.tmp-gen/comfy.pid`) and left running between calls. `--stop` kills only the process this tool started.
4. **Post-process** (`lib/postprocess.mjs`): the family's `post` list, e.g. `matte → trim → pixelate → outline → quantize`. `matte` removes the background with an ISNet matting model (`py/matte.py`, onnxruntime from the ComfyUI venv, ~2 s for 4 images), then thresholds the mask, drops specks, fills small holes and erodes 1 px. Colour keying (`keyout`) is kept as a step but is not used by any family: a background the same colour as the subject (grey on grey, cream fur) leaks into the subject, and pockets between limbs survive.
5. **Sheet** (`lib/sheet.mjs`): `.tmp-gen/<slug>/sheet.png` shows the references on top and the numbered candidates below (4× nearest for pixel families). Read it to choose.

| Family | Target | Style | Alpha |
|---|---|---|---|
| `item-pixel` | 48×48 | pixel art, like `items/cheese.png` | transparent |
| `enemy-pixel` | longer side by Size tier, natural aspect | pixel-art sprite | transparent |
| `portrait-pixel` | 256×256 | pixel-art bust, 2× chunky pixels | transparent |
| `zone-pixel` | 832×1248 | pixel-art landscape | opaque |
| `town-painterly` | 1376×768 | painterly matte | opaque |

**Size tier** (enemies): `tiny` 96, `small` 144, `medium` 192, `large` 256 px on the longer side. Pixel density is constant (2 output px per art pixel), so a smaller tier has fewer art pixels. Omitting `--tier` means `medium`, reported as `sizeGuessed: true`.

## One-time setup

`matte` needs the model once (it is not in git):

```
curl -L -o "%APPDATA%kritaai_diffusionservermodelsmattingisnet-general-use.onnx" https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
```

Override locations with `ASSET_GEN_PYTHON` / `ASSET_GEN_MATTE_MODEL`.

## CLI reference

```
generate --family <id> --target <path> --subject "<text>" [--count 4] [--seed N] [--no-ref] [--tier tiny|small|medium|large] [--recipe crab|gangsterCrab|spider|quadruped] [--control spider|crab|crabFront|quadruped] [--control-strength X] [--control-end X]
generate --pick <n> --slug <slug>            copy candidate n to its target and record it in manifest.json
generate --batch jobs.json                   [{family,target,subject,count?,seed?,tier?,tag?,noRef?}], one server boot
generate --estimate-hue <base target>        estimate shinyHue from the existing base + -shiny pair (run BEFORE regenerating)
generate --shiny-of <base target> [--hue N] [--saturation X] [--brightness X]  write <name>-shiny.png beside the base (hue-shifted;
                                             saturation/brightness for low-colour creatures, stored in the manifest)
generate --reprocess --slug <slug>           re-run post-process + sheet over the saved raw-N.png (no GPU)
generate --montage <png|dir>... [--pairs] [--bg #00aaff] [--cols 6] [--cell 300] [--out file]   numbered review montage on a contrasting backdrop
generate --list-families | --stop
tuning:  --steps --cfg --sampler --ip-weight --grid --colors --tag <suffix>
per job: --ref <repo path> (repeatable; replaces the family references) --style "<prompt>" (replaces the style prompt); batch fields refs, style, ipWeight, controlStrength, controlEnd
```

Run as `node scripts/asset-gen/generate.mjs …`. Progress goes to stderr, a JSON result to stdout (`slug`, `seed`, `candidates`, `sheet`, `seconds`, `tier`, `sizeGuessed`). Candidates are written to `.tmp-gen/<slug>/` (gitignored); `--pick` writes the final file. Redo = same target with a new `--seed` or an edited subject; `--pick` overwrites the manifest entry.

`scripts/asset-gen/manifest.json` (tracked) maps target → `{family, tier, subject, seed, date}` plus `shinyHue` for enemies. Targets under `.tmp-gen/` are never recorded.

## Anatomy and controls

SDXL cannot count limbs. For spiders (8 legs), crabs (2 claws + 8 legs) and four-legged animals in side view (4 legs, facing left) pass `--control spider|crab|quadruped`: `lib/controls.mjs` draws a scribble skeleton and the union ControlNet (strength 0.5, first half of sampling) fixes the layout while the family still sets the style. Add a new control by adding a drawing function to `CONTROLS`. For everything else, state the counts in the subject, use `--count 6`, and reject bad candidates when picking. `matte` also removes backdrop attached to the subject (`bgDistance`), detached fragments and enclosed holes; portraits are edge-padded (`pad: 96`) so a bust cropped by the frame is not masked out along the cut. Raw generations are saved (`raw-N.png`), so post-process changes can be applied with `--reprocess`.

## Species recipes

A recipe bundles the per-job settings that make one kind of creature come out right (skeleton control, references, style, strengths). Use `--recipe <name>` (batch field `recipe`); explicit fields still override it. The recipes live in `RECIPES` in `styles.mjs`, which is the one place to read or change them: `crab` and `gangsterCrab` (front-view crab in the look of the original crab sprites kept in `scripts/asset-gen/refs/`), `spider`, `quadruped`. Add a recipe there and a skeleton in `lib/controls.mjs`.

## Reviewing a set

`generate --montage <dir>` (e.g. `src/assets/img/enemies --pairs` for every sprite next to its shiny, or a `.tmp-gen/<slug>` folder for one batch's candidates) flattens sprites onto saturated blue with numbered badges and prints the number-to-file mapping. Use it instead of the generation sheet when judging cutouts: the sheet's dark backdrop hides grey residue, holes and slabs. Default output `.tmp-gen/montage.png`.

## QC

`generate` prints `qc` per candidate (empty flags = clean): holes inside the body, detached fragments or specks, a subject running off the generated frame, wrong size or colour budget; `--pick` repeats the flags of what you picked. `node scripts/asset-gen/qc.mjs` checks the committed art in `manifest.json` (plus whether each shiny differs from its base), and `npm run test:assets` fails on any defect beyond the baseline in `qc-known.json` (fix the asset, then `qc.mjs --update-known` to shrink it). QC cannot judge limb or head counts or species fidelity: that stays a visual review.

## Writing a subject

Content only: the thing, its pose or scene, distinguishing features. Never style words (pixel art, outline, palette, background colour). Avoid naming creatures when you want an object (`gnoll` made the model draw gnolls; describe the object).

## Add or tune a family

1. Add the family to `FAMILIES` in `styles.mjs` and its final size to `FAMILY_TARGETS` (validated at load: refs must exist, target must match).
2. Pick 3–6 references that are real, distinct art. Exclude placeholder duplicates: `items/` files byte-identical to `apple.png`, and the 13 enemy sprites that are copies of one placeholder.
3. Run a live sheet into a scratch target (e.g. `.tmp-gen/scratch/x.png`) and compare against the references. Use `--tag` for A/B variants (`--no-ref`, `--ip-weight`, `--steps`) and `--keep-raw` to see the unprocessed generation.
4. Tune in the registry entry. Known levers: `ipWeight` (higher pulls colour toward the reference background), `refBackground` (refs are flattened onto it; keep it neutral grey, since saturated colours tint subjects), `grid`/`colors` in `post`, `sampler`.
5. Add a test in `scripts/asset-gen/test/` for any new post-process step or sizing rule.

## Shinies

Shiny sprites are separate hue-shifted files at `<name>-shiny.png` (the runtime derives the path with `toShinyUrl`). Before regenerating a legacy enemy run `--estimate-hue` on it (the legacy base/shiny pair is the only source of the angle); afterwards `--shiny-of` applies the stored angle, or `--hue N` overrides it.

## Tests

`npm run test:assets` (node:test, no GPU needed): post-process steps, graph builder, ComfyUI adapter against a fake http/ws server, registry validation, tiers, batch and manifest, shiny.
