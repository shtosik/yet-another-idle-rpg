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

Feature branch → PR into `staging` → merge (deploys staging). When a release is decided: `release/x.y.z` branch from `staging` → version bump → PR into `main` → merge (deploys production, tags `vx.y.z`, publishes a GitHub release) → merge `main` back into `staging`.

To put any branch on testing: GitHub → Actions → **Deploy** → **Run workflow** → pick the branch. The branch must contain `.github/workflows/deploy.yml`. Testing holds one build at a time; the next run replaces it.

Run titles in the Actions tab name the target: `testing ← <branch>`, `staging ← <commit>`, `production ← <commit>`. What is live on an environment right now: GitHub → Deployments → filter by environment.

## Releases

The version is `version` in `package.json`, `MAJOR.MINOR.PATCH` ([semver](https://semver.org/)). It only changes on a release branch; `staging` carries the last released version plus unreleased work. 0.1.0 is the first.

- **Every player-facing change** adds a note under `## [Unreleased]` in `CHANGELOG.md`, in the same PR: `- [type] text` with type `feature`, `bug` (a fix), `buff` or `nerf`. The game shows the changelog in Settings → What's new, each type as a colored badge; on staging, unreleased notes show as "Coming next". Notes are English only.
- **Cut a release**: GitHub → Actions → **Release** → **Run workflow** → pick `minor`, `patch` or `major` (the branch picker doesn't matter; it always starts from `staging`). `.github/workflows/release.yml` runs `npm run release -- <bump>` (bumps `package.json` and `package-lock.json`, moves the unreleased notes under `## [x.y.z] - <today>`), commits it to a new `release/x.y.z` branch and pushes it. The run's summary links the PR into `main`; open it from there. The workflow doesn't open the PR itself, because a PR created with the workflow token never triggers CI. Fixes found while testing go on the release branch. The changelog date is the day the release is cut, not the day it ships. Locally, the same is `npm run release -- <bump>` on a `release/*` branch.
- **First release (0.1.0)**: `staging` is already at 0.1.0 with its changelog section, so don't run the Release workflow: create `release/0.1.0` from `staging` by hand and open the PR. The CI bump check passes against `main`'s 0.0.0.
- **Hotfix**: `hotfix/x.y.z` from `main`, the fix, a `bug` note, `npm run release -- patch`, PR into `main`.
- **After either**: PR `main` into `staging`, so staging has the bump and any fixes.
- CI on a PR into `main` fails unless the branch is `release/*` or `hotfix/*` and its version is above `main`'s (`node scripts/release.mjs check-bump`). `npm run validate` checks that `CHANGELOG.md` has a section for the current version and that every note has a known type.
- After a production deploy, the `release` job in `deploy.yml` tags `v<version>` and publishes a GitHub release with that version's notes. A redeploy of an already tagged version skips it.

### What the player sees

- `npm run build` and `npm run build:testing` end with `scripts/write-version.mjs`, which writes `version.json` (`version`, `commit`, `builtAt`) next to the build.
- `src/app/services/version-check.service.ts` fetches it on load, every 5 minutes and when the tab becomes visible. A different `commit` (any new deploy, also staging without a bump) or a `version` other than the bundle's shows a banner with a Reload button; the reload saves first. `npm start` has no `version.json`, so no banner in dev.
- Settings shows the running version (`src/app/version.ts`, read from `package.json`).

## Workflows

- `.github/workflows/ci.yml` runs on PRs into `main` and `staging`: the release check (PRs into `main` only), `npm run validate`, `npm run build`. `npm run test:assets` stays local: it needs the matting model under `krita/`, which is not in git.
- `.github/workflows/release.yml` (manual) cuts `release/x.y.z` from `staging` with the version bump (Releases).
- `.github/workflows/deploy.yml` runs `npm run validate`, the build for the environment, then `wrangler deploy --env=<environment> --domain $DOMAIN`. A deploy creates the Worker and its custom domain on first run. Production deploys then run the `release` job.

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
