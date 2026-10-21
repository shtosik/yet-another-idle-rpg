# Yet Another Idle RPG

A browser idle RPG built with Angular. Your character auto-battles through zones and waves, levels a radial skill tree, collects gear, pets and shinies, crafts food and potions at the Camp, and takes on quests from NPCs in towns.

## Run it

```bash
npm install
npm start          # http://localhost:4200
```

## Scripts

| Script | What it does |
|---|---|
| `npm start` | Dev server |
| `npm run build` | Production build to `dist/yari` |
| `npm run validate` | Checks game data, translations, asset paths and doc references |
| `npm run tile` | Regenerates world map tiles from the source art |
| `npm run test:assets` | Tests for the art generation pipeline |

## Docs

- [CLAUDE.md](CLAUDE.md) — working rules and gotchas (for people and coding agents).
- [GLOSSARY.md](GLOSSARY.md) — game terms.
- [docs/systems/](docs/systems/) — how each game system works today.
- [docs/ideas/](docs/ideas/) — design backlog.
