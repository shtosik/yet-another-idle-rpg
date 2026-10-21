# Asset pipeline (`scripts/asset-gen/`)

Generated art comes from one CLI, `scripts/asset-gen/generate.mjs`. You give it a **Style Family**, a target path and a **subject** (what is depicted); the family owns everything about style. See `docs/adr/0001-pixel-art-via-ip-adapter-and-downscale.md` for why pixel art is IP-Adapter + downscale rather than a pixel LoRA.

## How a family works

A family (an entry in `styles.mjs`) is a named art recipe: checkpoint, style prompt, negative prompt, reference images, SDXL-native generation size, final target size and a post-process chain. A generation runs:

1. **References** (`lib/refs.mjs`): the family's reference images are flattened onto the family's `refBackground`, nearest-upscaled (pixel families) to 512² and fed to CLIP vision.
2. **Graph** (`lib/workflow.mjs`): checkpoint → Hyper-SDXL 8-step LoRA → IP-Adapter (style transfer from the refs, strength `ipWeight`) → KSampler (8 steps, euler, sgm_uniform) → decode → save. `--no-ref` drops the IP-Adapter branch. Options change the graph: `control` adds a union ControlNet, `source` starts from a frozen image instead of noise (img2img), `layer` adds LayerDiffuse (real transparency), and `lora: false` drops the Hyper LoRA. `enemy-pixel` has `layer: true, lora: false` and 25 dpmpp_2m steps built in (see Enemy recipe); the other families still use the 8-step Hyper LoRA graph above.
3. **ComfyUI** (`lib/comfy.mjs`): the server is booted if it is not running (detached with `pythonw`, so no console window; pid in `.tmp-gen/comfy.pid`, log in `.tmp-gen/comfy.log`) with `--reserve-vram 2` (2 GB stay free for the desktop; models that do not fit offload to RAM) and left running between calls. `--stop` kills only the process this tool started.
4. **Post-process** (`lib/postprocess.mjs`): the family's `post` list, e.g. `matte → trim → pixelate → outline → quantize`. `matte` removes the background with an ISNet matting model (`py/matte.py`, onnxruntime from the ComfyUI venv, ~2 s for 4 images), then thresholds the mask, drops specks, fills small holes and erodes 1 px. With `layer` the generation already has real alpha, so `matte` becomes `alpha` (snap to 0/255, drop specks). Colour keying (`keyout`) is kept as a step but is not used by any family: a background the same colour as the subject (grey on grey, cream fur) leaks into the subject, and pockets between limbs survive.
5. **Sheet** (`lib/sheet.mjs`): `.tmp-gen/<slug>/sheet.png` shows the references on top and the numbered candidates below (4× nearest for pixel families). Read it to choose.

| Family | Target | Style | Alpha |
|---|---|---|---|
| `item-pixel` | 48×48 | pixel art, like `items/cheese.png` | transparent |
| `enemy-pixel` | longer side by Size tier, natural aspect | pixel-art sprite, LayerDiffuse transparency | transparent |
| `portrait-pixel` | 256×256 | pixel-art bust, 2× chunky pixels | transparent |
| `zone-pixel` | 832×1248 | pixel-art landscape | opaque |
| `town-painterly` | 1376×768 | inked cartoon illustration (laHarpar look) | opaque |
| `skill-icon` | 256×256 | inked cartoon tile like `skills/attackPower.png`, full-frame scene | opaque, rounded corners cut by `tile` |

**Size tier** (enemies): `tiny` 96, `small` 144, `medium` 192, `large` 256 px on the longer side. Pixel density is constant (2 output px per art pixel), so a smaller tier has fewer art pixels. Omitting `--tier` means `medium`, reported as `sizeGuessed: true`.

**Town and building backgrounds** (`town-painterly`): references are frozen copies in `scripts/asset-gen/refs/background/` (`laHarpar`, `mawood`), and a `shave` post step drops the 4 px border because the generator leaves a bright top row. Lessons from the Mawood set: the references pull every result bright, so a dark scene needs the prompt, the negatives and, for a dark exterior, a darkened source repaint (`--source`, denoise about 0.55-0.7, ipWeight 0.4); denoise below about 0.5 keeps the source's values and colours, so recolouring needs more. Prompt wording alone does not remove a lake, sky or pale trunks. No people in backgrounds. Procedural edits (recolouring trunks, darkening haze, clone-patching figures) were done with throwaway sharp scripts after generation.

**Lattice items** (a spider web): the `item-pixel` `matte` step fills enclosed holes, so a web comes out as a slab. SDXL also does not draw one. The web icon was drawn in code (spokes and sagging rings at 48 px, dark outline) and is recorded in the manifest as `procedural`.

## One-time setup

None of this is in git. The server is the one Krita AI Diffusion manages, in `%APPDATA%\krita\ai_diffusion\server\ComfyUI` (below: `<comfy>`).

`matte` needs the model once:

```
curl -L -o "%APPDATA%\krita\ai_diffusion\server\models\matting\isnet-general-use.onnx" https://github.com/danielgatis/rembg/releases/download/v0.0.0/isnet-general-use.onnx
```

Override locations with `ASSET_GEN_PYTHON` / `ASSET_GEN_MATTE_MODEL`.

**LayerDiffuse** (transparent generation, `layer`): `git clone https://github.com/huchenlei/ComfyUI-layerdiffuse` into `<comfy>\custom_nodes`, and install its `requirements.txt` into the server venv (the venv is uv-managed). The two models (`layer_xl_transparent_attn` 743 MB, `vae_transparent_decoder` 208 MB) download into `<comfy>\models\layer_model` on first use. A Krita AI Diffusion update can wipe `custom_nodes`; if a job fails with a missing `LayeredDiffusionApply` node, reinstall. The node's own `LayeredDiffusionDecodeRGBA` is broken on current ComfyUI (it calls a `JoinImageWithAlpha` method that no longer exists), so the graph decodes with `LayeredDiffusionDecode`, `InvertMask` and the core `JoinImageWithAlpha` instead.

**Z-Image-Turbo** (structure source, `--zimage`; Apache-2.0), from `https://huggingface.co/Comfy-Org/z_image_turbo/resolve/main/split_files/`:

| File | Into `<comfy>\models\` | Size |
|---|---|---|
| `diffusion_models/z_image_turbo_bf16.safetensors` | `diffusion_models` | 12.3 GB |
| `text_encoders/qwen_3_4b_fp8_mixed.safetensors` | `text_encoders` | 5.6 GB |
| `vae/ae.safetensors` | `vae` | 0.34 GB |

The graph loads the bf16 model with fp8 weights, so it fits a 12 GB card next to SDXL (models swap through system RAM). A 6.2 GB `z_image_turbo_int8_convrot` file exists and its quantisation is one the installed ComfyUI knows; it has not been tried here.

## CLI reference

```
generate --family <id> --target <path> --subject "<text>" [--count 4] [--seed N] [--no-ref] [--tier tiny|small|medium|large] [--control spider|crabFront|quadruped|…] [--control-strength X] [--control-end X] [--source <image> [--denoise 0.45] --no-layer] [--layer]
generate --zimage "<what to draw>" --name <creature> [--count 8] [--seed N]   Z-Image structure candidates into .tmp-gen/zimage-<creature>/
generate --pick <n> --slug <slug>            copy candidate n to its target and record it in manifest.json (a Z-Image slug freezes
                                             the candidate as refs/control/<creature>-source.png, no manifest entry)
generate --batch jobs.json                   [{family,target,subject,count?,seed?,tier?,tag?,noRef?}], one server boot
generate --estimate-hue <base target>        estimate shinyHue from the existing base + -shiny pair (run BEFORE regenerating)
generate --shiny-of <base target> [--hue N] [--saturation X] [--brightness X]  write <name>-shiny.png beside the base (hue-shifted;
                                             saturation/brightness for low-colour creatures, stored in the manifest)
generate --reprocess --slug <slug>           re-run post-process + sheet over the saved raw-N.png (no GPU)
generate --list-families | --stop
tuning:  --steps --cfg --sampler --ip-weight --grid --colors --tag <suffix>
per job: --ref <repo path> (repeatable; replaces the family references) --style "<prompt>" (replaces the style prompt) --negative "<terms>" (added to the family negative prompt)
         batch fields: refs, style, negative, ipWeight, control, controlStrength, controlEnd, source, denoise, layer, lora (false = no Hyper LoRA), steps, cfg, sampler
```

Run as `node scripts/asset-gen/generate.mjs …`. Progress goes to stderr, a JSON result to stdout (`slug`, `seed`, `candidates`, `sheet`, `seconds`, `tier`, `sizeGuessed`, `qc`; see Automatic QC). Candidates are written to `.tmp-gen/<slug>/` (gitignored); `--pick` writes the final file. Redo = same target with a new `--seed` or an edited subject; `--pick` overwrites the manifest entry.

`scripts/asset-gen/manifest.json` (tracked) maps target → `{family, tier, subject, seed, date}` plus `shinyHue` for enemies. Targets under `.tmp-gen/` are never recorded.

## Anatomy and controls

SDXL cannot count limbs. The root cause is its CLIP text encoder, which reads a prompt like a bag of words, so "four legs per side" arrives as a soft hint (research and sources: `docs/analysis/crab-anatomy-generation.md`). Models that read prompts with a language model (Gemini, Z-Image, FLUX.2, Qwen-Image) get body plans right, but SDXL does give correct anatomy when the structure is handed to it. There are two ways to hand it over, both keep SDXL, the golden references and the post-process chain for style:

- **Control image** (`--control <name>`, `lib/controls.mjs`): the union ControlNet fixes the layout while the family still sets the style. Controls are either SVG drawings or frozen images from `refs/control/`, and `CONTROL_TYPES` says which ControlNet mode a control uses (scribble unless listed). Controls: `spider` (frozen silhouette of a checked Z-Image spider, 3/4 front view, four legs per side plus palps), `spiderSketch` and `spiderTop` (hand-drawn skeletons), `crabFront` (frozen line art of a Z-Image crab, line-art mode), `crabFrontSketch` and `crab` (hand-drawn, front and top view), `quadruped` (side view, four legs). **A silhouette fixes only the outline**, so colour, markings and texture follow the subject; **line art copies the interior lines too**, so every result is a repaint of that one source (and its plate-like double edges gave crab shells a metallic look). Prefer silhouettes. Top-down views were rejected for spiders (the camera looked wrong in the game); a spider outlined instead of filled reads as extra legs.
- **Source image** (`--source <image> [--denoise 0.45]`): SDXL repaints a frozen image (img2img) instead of starting from noise. At 0.45 the shapes survive and the style comes in; around 0.55 outlines get ragged, above ~0.65 faces and metal return. Z-Image draws the source (`--zimage`), you check its anatomy once, and `--pick` freezes it as `refs/control/<name>-source.png`. The repaint keeps whatever is on the source, so pick one with no face or marks on the shell.

Z-Image gets claws, eye stalks and body plans right but cannot count many identical thin limbs: all 16 of its test spiders had the wrong leg count (usually 9-10), with or without "exactly eight legs" in the prompt. So spiders use the control image, crabs the source image. For everything else, state the counts in the subject, use `--count 6`, and reject bad candidates when picking. `matte` also removes backdrop attached to the subject (`bgDistance`), detached fragments and enclosed holes; portraits are edge-padded (`pad: 96`) so a bust cropped by the frame is not masked out along the cut. Raw generations are saved (`raw-N.png`), so post-process changes can be applied with `--reprocess`.

## Species recipes

Per-job overrides keep species tuning out of the registry. The `enemy-pixel` family carries the enemy recipe below as its defaults; the species recipes only add to it.

**References.** `enemy-pixel` uses the 7 user-approved golden sprites in `scripts/asset-gen/refs/enemy/` (goat, gnollScout, giantEagle, deer, canopyBandit, bandit, wolf); the accepted `forestSpider.png`, `forestSpider-alt.png` and `elderSpider.png` sit beside them, unused until a job lists them. They are **frozen copies**: a reference must never point at a live `src/assets` file, because regenerating overwrites it and one bad sprite (the troll's grey slab) then leaks into every later generation. The old bright `legacy-crab` / `legacy-gangsterCrab` references are not used any more: they teach eyes on the shell front.

**Enemy recipe** (the `enemy-pixel` defaults): `layer: true, lora: false`, 25 steps, cfg 6, `dpmpp_2m`, `ipWeight: 0.8`, the 7 golden refs, `style: "clean bright pixel art game sprite, flat colours, bold dark outline, simple shading with highlights, limited colour palette, isolated, no background"`. LayerDiffuse generates real transparency, which removes the grey backdrop noise matting could not (enclosed backdrop pockets, cast shadows, a backdrop the same colour as the subject). It was trained against the plain SDXL model, so it needs the Hyper LoRA off, 25 steps, and a plain style prompt without setting words ("dark fantasy"): with the LoRA or such words the alpha comes out as garbage.

It is also sensitive to how hard the references pull. On a troll prompt `ipWeight` 0.5 left about half of the candidates with an opaque pale backdrop slab, and with no references or 0.3 most did; 0.8 and 1.0 gave none in 16 candidates (the same prompts at 0.5: 2 of 8 slabs). Higher weights also wash out the subject's own colours (a green-striped spider turned pale grey at 0.8), hence the per-species values below. A slab shows as raw alpha ≥ 128 covering most of the frame (a normal subject covers 0.15-0.4; slabs 0.6-1.0; the QC `slab` flag), and raw alpha with no fully transparent pixel is not a failure by itself, because `alpha` snaps the faint haze to 0. Still look at every candidate on a magenta backdrop.

- **Spiders**: the enemy recipe plus `ipWeight: 0.5`, `control: "spider"`, `controlStrength: 0.75`, `controlEnd: 0.8`, `negative: "extra legs, merged legs, extra eyes"`. The control makes the alpha reliable at the weaker reference weight. Subject: body plan, colours and markings in plain words ("a forest spider seen from the front and slightly above, brown head with small fangs, a big round abdomen striped moss green and brown behind the head, eight brown hairy legs with green bands, four on each side"). Different species differ through the subject; a new pose needs a new checked source (generate with `--zimage`, count all eight legs, cut its silhouette to white on black 1024²) saved next to the spider control.
- **Crab / gangsterCrab**: `layer: false` (a source repaint is matted; the batch is rejected without it), `ipWeight: 0.5`: `--zimage` draws the crab (`pixel art of a red crab … two big claws raised with open pincers, two eyes on short stalks on top, a plain smooth shell with no face, walking legs on both sides`), freeze the best, then job `source: "scripts/asset-gen/refs/control/crab-source.png"`, `denoise: 0.45`, the enemy defaults for lora/steps/cfg/sampler/refs, `style: "detailed pixel art game enemy sprite, painterly shading, natural organic creature, dark outline, limited colour palette, plain white background"`, `negative: "face on the shell, eyes on the shell, mouth, smile, metal shell, metallic, armour, chrome, robot, glossy, shadow"`. The family's `matte` step cuts out the white. The crab is the plain two-claw crab; the gangster crab (`gangsterCrab-source.png`) has a kitchen-knife blade in place of one claw and no gangster wording in the prompt (the model took the label literally).
- **Quadrupeds**: `control: "quadruped"` as before; a Z-Image source would probably work as it does for crabs, but it has not been tried.

## Writing a subject

Content only: the thing, its pose or scene, distinguishing features. Never style words (pixel art, outline, palette, background colour). Avoid naming creatures when you want an object (`gnoll` made the model draw gnolls; describe the object). Describe the **body plan and what is physically visible**, not a setting or a role: setting words ("mossy", "ancient forest", "dark") and role labels ("gangster") get drawn literally, and a "skull-like pattern" produces real skulls (a second skull as the head), a "face" or "eyes" pattern a face on a shell. State the counts the model gets wrong and describe ONE subject (words like "side view" or "turnaround" draw several copies).

## No environment

The sprite stands alone on transparency. SDXL adds scenery the prompt did not ask for: a dirt mound under a skeleton whose prompt said "moss and tangled roots", a puddle under a slime that was "melting", a forest behind a treant, a grass patch under a bear. Rules:

1. **No environment unless prompted**: do not describe anything that sits on the floor (moss, roots, grass, puddles, mounds, rocks, a base) as part of the creature. Put moss or roots on the body ("moss growing on its ribs"), never "at its feet".
2. The `enemy-pixel` negative prompt has `grass, dirt mound, soil, rocks at the feet, puddle, ground patch, base under the feet, scenery` next to the existing `ground, floor, platform, pedestal, ground shadow`.
3. A candidate that stands on a mound, a patch or a shadow is rejected, even if the figure is good; reroll with the wording changed.

## One creature per image

SDXL often draws the subject twice (a second rat or bear under the first). It happened on 1 of 6 bears and bats, 1 of 6 rats and 4 of 6 giant rats; the QC `fragment` flag catches most of these. Rules:

1. **Start the subject with "a single …" or "one …"** and write the species once. Say "alone" for animals that come in groups (rats, bats, gulls).
2. **No view words** ("side view", "front view", "three-quarter view", "turnaround") unless a control fixes the pose: they read as "show several views" and draw several copies. The giant rat prompt that said "in side view" gave duplicates on 4 of 6 candidates.
3. The `enemy-pixel` negative prompt has `two animals, pair of animals, group of creatures, several creatures, second creature, duplicate creature, two of the same creature`.
4. A duplicate is never a pick; reroll or tighten the subject.

## Weapons

SDXL draws weapons badly: blades that turn into a bow halfway, doubled or merged weapons, a weapon that passes through the body. Rules that came out of a test on the goblins (same seeds, 6 candidates each; the bandit's sword in the reference set was suspected of leaking into every humanoid, so references were also tried without it):

1. **One weapon per creature, named once**, with the hand: "one short straight rusty knife in its right hand, nothing in the left hand". Say the other hand is empty.
2. **Plain shape and material**: "short straight knife", "plain wooden club", "single-bladed axe on a long straight wooden handle", "straight rusted sword". No decorative adjectives (ornate, jagged, serrated, curved, glowing).
3. **Nothing attached to the weapon and at most one other carried item**: no quiver, arrows, sheath, scabbard, bandolier. In the test, dropping the sack and naming one knife turned a mixed set of malformed weapons into 6 of 6 clean straight knives.
4. **State the proportions of a weapon**: "a long blade with a short hilt and a small crossguard", "an axe head on a long straight handle". Without them the hilt or handle comes out as long as the blade (a skeleton's sword). Negative prompt for the other way round: `long handle, long hilt`.
5. **Prefer rigid straight weapons** (knife, sword, club, axe, spear, staff). Bows, slings, whips, chains and flails are error-prone: expect about half of the candidates to be unusable, generate 8 instead of 6, and look at the bow, the string and the hand on each. A different weapon for the creature is cheaper than a bow.
6. The `enemy-pixel` negative prompt already has `two weapons, double weapon, merged weapons, bent blade, broken weapon`. Add per-job negatives for the weapons the creature does not carry (a bow archer: `sword, quiver, arrows`).

What did **not** help: restricting the references to animals only (no sword leakage to remove, and the colours went duller), and drawing the structure with Z-Image then repainting it. Z-Image draws bows and knives correctly, but its goblins are cute and round, the repaint keeps those proportions, and the matte cuts holes in pale bellies and leaves white background inside the loop of a bow. Use the Z-Image source route for crabs, not humanoids.

When reviewing: reject a weapon that changes shape along its length, is doubled, floats away from the hand, passes through the body, or is held in the wrong number of hands. QC cannot see any of this.

## Add or tune a family

1. Add the family to `FAMILIES` in `styles.mjs` and its final size to `FAMILY_TARGETS` (validated at load: refs must exist, target must match).
2. Pick 3–6 references that are real, distinct art. Exclude placeholder duplicates: `items/` files byte-identical to `apple.png`, and the 13 enemy sprites that are copies of one placeholder.
3. Run a live sheet into a scratch target (e.g. `.tmp-gen/scratch/x.png`) and compare against the references. Use `--tag` for A/B variants (`--no-ref`, `--ip-weight`, `--steps`) and `--keep-raw` to see the unprocessed generation.
4. Tune in the registry entry. Known levers: `ipWeight` (higher pulls colour toward the reference background), `refBackground` (refs are flattened onto it; keep it neutral grey, since saturated colours tint subjects), `grid`/`colors` in `post`, `sampler`.
5. Add a test in `scripts/asset-gen/test/` for any new post-process step or sizing rule.

## Shinies

Shiny sprites are separate hue-shifted files at `<name>-shiny.png` (the runtime derives the path with `toShinyUrl`). Before regenerating a legacy enemy run `--estimate-hue` on it (the legacy base/shiny pair is the only source of the angle); afterwards `--shiny-of` applies the stored angle, or `--hue N` overrides it.

## Tests

`npm run test:assets` (node:test, no GPU needed): post-process steps (including `alpha`), graph builder (LayerDiffuse, no-LoRA, control and source graphs), Z-Image graph and structure job, QC checks (synthetic shapes), ComfyUI adapter against a fake http/ws server, registry validation, tiers, batch and manifest, controls, shiny.

## Editing a finished image (`edit.mjs`)

For repairs after generation, use `node scripts/asset-gen/edit.mjs <command>` (`lib/edit.mjs`, tested) instead of writing a script: `stats` (luminance, edge strips, flags), `darken` (a darker, teal-tinted source with a dark top gradient, for a repaint), `haze` (darkens pale haze behind a foreground), `trunks` (brown trunks toward pale silver-grey), `trim` (drops an edge strip), `patch --box x0,y0,x1,y1,dx,dy` (clones pixels from an offset over a box, e.g. to remove a small figure) and `montage` (numbered grid with each image's luminance, for the user to review). The sheet's reference row shows what the model sees: a centre square crop (`cover`) of each reference at 512 px, so a wide background reference is cropped; check that crop matches the style you want before a batch.

## Reviewing candidates

### Automatic QC (`lib/qc.mjs`)

Every job for a transparent family gets a `qc` list in its JSON result and `meta.json`: per candidate `{n, flags: [{code, detail}], metrics}`. A flagged candidate has a **red number badge** on the sheet. **Flags only point at where to look; nothing is blocked**, and `--pick` still works and echoes the picked candidate's `qcFlags`. `--reprocess` recomputes QC from the saved raws.

| Flag | Meaning | Rule |
|---|---|---|
| `slab` | the cutout is a backdrop rectangle | raw alpha covers ≥ 55% of the frame, or the silhouette fills ≥ 88% of its bounding box |
| `fragment` | detached pieces | an opaque piece apart from the main body, ≥ 2% of the sprite |
| `hole` | an empty patch deep inside the body | an enclosed hole ≥ 1.5% of the sprite with ≥ 10% of the sprite's longer side of body around it; gaps between limbs, or between an arm and the torso, have thinner walls and are not flagged |
| `hollow` | a see-through shell instead of a solid body | enclosed empty space ≥ 30% of the filled silhouette (translucent slimes drew as empty arches at 38-50%; skeletons reach 24%, everything else stays under 18%; thick-walled arches at about 22% are missed) |
| `skeleton` | the shape strays from its control | needs a `control` and a LayerDiffuse raw: under 60% of the skeleton covered, over 30% of the shape outside it, and for a silhouette control more than 5% of its body core empty, or more limbs than the control on at least 2 of 6 rings around the body |
| `empty` | nothing left after cutout | |
| `edge` | opaque images only: a bright or black strip on one side | the outer 3 px differ from the band 8-16 px inside by ≥ 45 (clean generations by under 15). The generator leaves a bright top row; the family's `shave` step removes it |
| `tone` | opaque images only: nearly black or washed out | mean luminance under 12 or over 215 |

Opaque families (backgrounds) get `edge` and `tone` instead of the cutout checks, and `metrics.luminance` holds the mean (0-255; the dark Mawood forest is about 40-65 by the greyscale mean, the interiors 70-100). Check a finished file with `node scripts/asset-gen/generate.mjs --qc <image>`.

Calibration: the 31 shipped enemy sprites give no flags. On 12 real spider generations (a fixed seed, silhouette control) it flagged 4: the two with extra or doubled legs, one with a notch cut into the abdomen, and one with its head and abdomen stacked in the wrong place, and it passed the 3 candidates the user had accepted. It missed one candidate with a single doubled leg. The `hole` rule was first tuned on spiders and then flagged 12 of 24 troll, goblin and gnoll candidates for the gap between an arm and the torso; it was retightened on those (now only a troll with several torso patches is flagged). `fragment` and `slab` were only checked on synthetic images and the shipped sprites. Treat a pass as "nothing obvious", not as approval. The `skeleton` body and limb checks only run with a silhouette control (spider).

QC cannot see a face painted on a shell, a metallic or plated surface, grey halo residue, or a wrong limb count without a control, and matted jobs (`layer: false`) have no raw alpha, so they skip the slab-by-raw and `skeleton` checks. Still judge transparency on a **magenta** backdrop, not the sheet's dark grey: grey residue and backdrop pockets disappear against grey. Count limbs, eyes and claws against the creature, and reject empty patches in the body, a face painted on a shell, a metallic or plated look on an organic creature, and several copies of the subject.
