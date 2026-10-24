# Deployment

The game is a static Angular build served by Cloudflare Workers (static assets, no script). Each environment is its own Worker, defined in `wrangler.jsonc`, and GitHub Actions builds and deploys all of them. Cloudflare's own Git builds are off.

## Environments

| Environment | Worker | Deployed by | Build | Cheat bar |
|---|---|---|---|---|
| production | `yet-another-idle-rpg` | push to `main` | `npm run build` | no |
| staging | `yet-another-idle-rpg-staging` | push to `staging` | `npm run build` | no |
| testing | `yet-another-idle-rpg-testing` | manual run, any branch | `npm run build:testing` | yes |
| dev | — | `npm start` | development | yes |

Domains are not in the repo. Each GitHub environment (`production`, `staging`, `testing`) has a `DOMAIN` variable, and the deploy passes it as `wrangler deploy --domain`. To move an environment to another domain, change the variable and redeploy. The deploy fails if `DOMAIN` is missing.

Each domain is a separate origin, so saves in `localStorage` never mix between environments.

## Branch flow

Feature branch → PR into `staging` → merge (deploys staging) → PR `staging` into `main` → merge (deploys production).

To put any branch on testing: GitHub → Actions → **Deploy** → **Run workflow** → pick the branch. The branch must contain `.github/workflows/deploy.yml`. Testing holds one build at a time; the next run replaces it.

## Workflows

- `.github/workflows/ci.yml` runs on PRs into `main` and `staging`: `npm run validate`, `npm run build`. `npm run test:assets` stays local: it needs the matting model under `krita/`, which is not in git.
- `.github/workflows/deploy.yml` runs `npm run validate`, the build for the environment, then `wrangler deploy --env=<environment> --domain $DOMAIN`. A deploy creates the Worker and its custom domain on first run.

GitHub's standard runners are free for public repos, and `wrangler deploy` uploads a finished build, so deploys don't use Cloudflare's build minutes.

## Build configurations

`src/environments/environment.ts` holds build flags. `angular.json` swaps it per configuration:

- `production` → `environment.prod.ts` (cheats off), also swaps `devtools.ts` for `devtools.prod.ts`.
- `production,testing` → production settings plus `environment.testing.ts` (cheats on), still without NgRx devtools.
- `development` → `environment.ts` as is (cheats on).

`DevCheatsComponent` renders only when `environment.cheats` is on. It sits in a `@defer` block, so production never loads its chunk.

## Setup (one time)

1. Cloudflare → My Profile → API Tokens → create a token from the **Edit Cloudflare Workers** template, scoped to this account and the `yetanotherrpgidle.eu` zone.
2. GitHub repo → Settings → Secrets and variables → Actions → repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
3. GitHub repo → Settings → Environments → `production`, `staging`, `testing`, each with a `DOMAIN` variable (e.g. `staging.yetanotherrpgidle.eu`).
4. Cloudflare → Worker `yet-another-idle-rpg` → Settings → Build → disconnect the Git repository, so `main` doesn't deploy twice.
5. GitHub → Settings → Branches → protect `main` and `staging`: require a PR and the **CI / checks** status check.
