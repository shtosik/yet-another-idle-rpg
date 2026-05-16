#!/usr/bin/env node
// Slices src/assets/img/world/source.png into a Leaflet CRS tile pyramid.
// Run with: npm run tile
// Re-runnable: regenerates all tiles and manifest from the current source image.
//
// Strategy: at each zoom level, downsample the WHOLE source image to that level's
// resolution in one pass, then cut it into 256×256 tiles with pixel-aligned
// `extract` (no per-tile resize). This guarantees adjacent tiles share exact
// edge pixels — no bilinear/lanczos seams at tile boundaries.
//
// Pyramid layout:
//   z = 0       → 1 tile covering the whole source, downsampled to TILE_SIZE
//   z = maxZoom → many tiles, each 1:1 with source pixels
// Image content at each level occupies (round(W * 2^(z-maxZoom)), round(H * ...))
// pixels in the top-left; the rest of an edge tile is transparent padding.

import sharp from 'sharp';
import { mkdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const SOURCE    = join(ROOT, 'src/assets/img/world/source.png');
const OUT_DIR   = join(ROOT, 'src/assets/maps/world');
const TILES_DIR = join(OUT_DIR, 'tiles');
const TILE_SIZE = 256;

async function main() {
  const { width, height } = await sharp(SOURCE).metadata();
  console.log(`Source: ${width}×${height}`);

  // Smallest maxZoom at which the source still fits 1:1 in the pyramid grid.
  const maxZoom = Math.max(0, Math.ceil(Math.log2(Math.max(width, height) / TILE_SIZE)));
  // Lowest useful zoom: image's largest dimension is still ≥ one tile wide.
  const minZoom = Math.max(0, Math.ceil(maxZoom + Math.log2(TILE_SIZE / Math.max(width, height))));

  console.log(`Zoom levels: ${minZoom}–${maxZoom}\n`);

  if (existsSync(TILES_DIR)) {
    await rm(TILES_DIR, { recursive: true });
  }
  await mkdir(TILES_DIR, { recursive: true });

  for (let z = minZoom; z <= maxZoom; z++) {
    const scale  = 2 ** (z - maxZoom);
    const levelW = Math.max(1, Math.round(width  * scale));
    const levelH = Math.max(1, Math.round(height * scale));

    // Resize the whole image once at this level. Keeping it as a raw pixel
    // buffer means every per-tile `extract` is a plain memcpy with no resampling.
    const { data: levelData, info: levelInfo } = await sharp(SOURCE)
      .resize(levelW, levelH, { kernel: 'lanczos3', fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const rawOpts = {
      raw: {
        width:    levelInfo.width,
        height:   levelInfo.height,
        channels: levelInfo.channels,
      },
    };

    const numX = Math.ceil(levelW / TILE_SIZE);
    const numY = Math.ceil(levelH / TILE_SIZE);
    let count = 0;

    for (let tx = 0; tx < numX; tx++) {
      await mkdir(join(TILES_DIR, String(z), String(tx)), { recursive: true });

      for (let ty = 0; ty < numY; ty++) {
        const left  = tx * TILE_SIZE;
        const top   = ty * TILE_SIZE;
        const tileW = Math.min(TILE_SIZE, levelW - left);
        const tileH = Math.min(TILE_SIZE, levelH - top);

        let pipeline = sharp(levelData, rawOpts)
          .extract({ left, top, width: tileW, height: tileH });

        if (tileW < TILE_SIZE || tileH < TILE_SIZE) {
          pipeline = pipeline.extend({
            top: 0,
            left: 0,
            bottom: TILE_SIZE - tileH,
            right:  TILE_SIZE - tileW,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          });
        }

        await pipeline
          .webp({ quality: 85 })
          .toFile(join(TILES_DIR, String(z), String(tx), `${ty}.webp`));

        count++;
      }
    }

    console.log(`  z=${z}: ${count} tiles (${numX}×${numY}, level ${levelW}×${levelH})`);
  }

  const manifest = { width, height, tileSize: TILE_SIZE, minZoom, maxZoom };
  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );

  console.log('\nManifest:', manifest);
  console.log('Done.');
}

main().catch(err => { console.error(err); process.exit(1); });
