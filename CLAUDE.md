# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

<!-- BEGIN swamp managed section - DO NOT EDIT -->
# Project

This repository is managed with [swamp](https://github.com/swamp-club/swamp).

## Rules

1. **Search before you build.** When automating AWS, APIs, or any external service: (a) search community extensions with `swamp extension search <query>` — prefer `@swamp/*` official extensions first, (b) search local/installed types with `swamp model type search <query>`, (c) if a community extension exists, install it with `swamp extension pull <package>` instead of building from scratch, (d) extend an existing type if it covers the domain but lacks the method you need, (e) only create a custom extension model in `extensions/models/` as a last resort. Use the `swamp` skill for guidance. The `command/shell` model is ONLY for ad-hoc one-off shell commands, NEVER for wrapping CLI tools or building integrations.
2. **Extend, don't be clever.** When a model covers the domain but lacks the method you need, extend it with `export const extension` — don't bypass it with shell scripts, CLI tools, or multi-step hacks. One method, one purpose. Use `swamp model type describe <type> --json` to check available methods.
3. **Use the data model.** Once data exists in a model (via `lookup`, `start`, `sync`, etc.), reference it with CEL expressions. Don't re-fetch data that's already available.
4. **CEL expressions everywhere.** Wire models together with CEL expressions. Always prefer `data.latest("<name>", "<dataName>").attributes.<field>` over the deprecated `model.<name>.resource.<spec>.<instance>.attributes.<field>` pattern.
5. **Verify before destructive operations.** Always `swamp model get <name> --json` and verify resource IDs before running delete/stop/destroy methods.
6. **Prefer fan-out methods over loops.** When operating on multiple targets, use a single method that handles all targets internally (factory pattern) rather than looping N separate `swamp model method run` calls against the same model. Multiple parallel calls against the same model contend on the per-model lock, causing timeouts. A single fan-out method acquires the lock once and produces all outputs in one execution. Check `swamp model type describe` for methods that accept filters or produce multiple outputs.
7. **Extension npm deps are bundled, not lockfile-tracked.** Swamp's bundler inlines all npm packages (except zod) into extension bundles at bundle time. `deno.lock` and `package.json` do NOT cover extension model dependencies — this is by design. Always pin explicit versions in `npm:` import specifiers (e.g., `npm:lodash-es@4.17.21`).
8. **Reports for reusable data pipelines.** When the task involves building a repeatable pipeline to transform, aggregate, or analyze model output (security reports, cost analysis, compliance checks, summaries), create a report extension. Use the `swamp` skill for guidance.
9. **"Workflow" means a swamp workflow.** In this repository the word "workflow" (and "create/run/execute/validate/debug workflow", "automate", "orchestrate", "automated/nightly job") refers to a swamp workflow — a declarative YAML DAG of model-method steps authored via `swamp workflow create`. Load and follow the `swamp` skill for these requests. Do NOT interpret these as a request to build an agent task list, spin up worktrees, or schedule a cron/remote agent. Only use those orchestration mechanisms when the user explicitly names one (e.g. "task list", "subagent", "worktree", "cron", "remote agent") or explicitly asks you to do the work yourself step by step rather than author a swamp workflow.
10. **Use swamp, don't bypass it.** Always work through swamp commands — don't go around them with raw shell tools. Use `swamp data query` to find data, not `grep`/`find` on `.swamp/` files. Use model methods to interact with resources, not `curl`/`aws`/`gcloud`/`kubectl` when a model type already wraps that API — check with `swamp model type search`. Use `swamp help` for CLI discovery, not guesswork. Composing with swamp output is fine (e.g. piping `--json` through `jq`) — the anti-pattern is bypassing swamp entirely.
11. **Inspect reports after failures.** When a model method or workflow run fails, inspect its generated reports before retrying or changing definitions. Reports run even on failure and capture structured diagnostics — error messages, execution status, arguments, and data output pointers. Use `swamp report get @swamp/method-summary --model <model> --json` for method failures or `swamp report get @swamp/workflow-summary --workflow <workflow> --json` for workflow failures. Run `swamp help report get` to confirm current retrieval syntax.

## Skills

**IMPORTANT:** Always load swamp skills, even when in plan mode. The skills provide
essential context for working with this repository.

- `swamp` - Swamp CLI — models, workflows, data, vaults, extensions, publishing, repos, reports, issues, and troubleshooting
- `swamp-getting-started` - Interactive onboarding for new swamp users

## Getting Started

**IMPORTANT:** At the start of every conversation, run
`swamp model search --json`. If no models are returned (empty result), you MUST
immediately invoke the `swamp-getting-started` skill before doing anything else.
This walks new users through an interactive onboarding tutorial.

If models already exist, start by using the `swamp` skill to work with
swamp models.

## Commands

Use `swamp --help` to see available commands. For a machine-readable JSON
schema of the CLI (commands, options, arguments) intended for agent
consumption, run `swamp help [<command>...]` — e.g. `swamp help` returns
the full tree, and `swamp help model method run` scopes to a subtree.
<!-- END swamp managed section -->

---

# alvagante.com Site

A GitHub Pages Jekyll site: compact personal link directory + AI-assisted daily news digests. Keep it file-backed and static — no backend, database, or admin UI.

## Architecture

**Jekyll site** served via GitHub Pages using the `github-pages` gem. No custom plugins allowed (must stay Pages-compatible). Liquid templates in `_layouts/` and `_includes/`.

**Canonical data** lives under `_data/`:
- `_data/links/<topic>/<category>.yml` — hand-curated directory entries (do not overwrite).
- `_data/sources/<category>.yml` — enabled RSS/Atom feeds by news category (do not overwrite).
- `_data/generated/news/YYYY-MM-DD.yml` — generated digest files (commit-worthy, machine-written).

**`_news_days/YYYY-MM-DD.html`** — one thin Jekyll collection stub per digest date (front matter is just `digest_date: "YYYY-MM-DD"`, no duplicated data). The `news_days` collection (`_config.yml`) gives each date a real page at `/news/<date>/` via the `news-day` layout, which looks the actual digest back up from `site.data.generated.news[page.digest_date]`. This lets `/news/` inline only the latest day and lazy-load any other date over `fetch()` (see `assets/js/filters.js`), instead of shipping every digest ever generated in one HTML payload. Keep writing a stub alongside every `_data/generated/news/*.yml` file — `build_daily_digest` does this automatically.

**Swamp extension** `@alvagante/site-curation` (`extensions/models/site_curation.ts`) is a fan-out model. The `build_daily_digest` method fetches all enabled feeds, optionally enriches via OpenAI, deduplicates, ranks, and writes the YAML digest plus its `_news_days/` stub in one run. Registered via `manifest.yaml`; the configured model instance is `site-curation` under `models/@alvagante/site-curation/`.

**Workflow** `daily-news` (`workflows/workflow-*.yaml`) calls `site-curation.build_daily_digest` and also runs on a daily schedule (05:17 UTC). Preserve the workflow UUID in the filename; create new workflows only with `swamp workflow create <name> --json`.

## Local Development

All Jekyll work runs through Docker — no host Ruby needed:

```bash
docker compose up jekyll          # serve at http://<host>:4000/ with LiveReload
docker compose up -d jekyll       # background
docker compose down
docker compose run --rm jekyll bundle exec jekyll build  # one-off build check
```

The service publishes `0.0.0.0:4000` and `0.0.0.0:35729` (LiveReload) so it's reachable from a remote node. Jekyll must start with `--host 0.0.0.0`.

Do not commit: `_site/`, `.jekyll-cache/`, `.jekyll-metadata`, `.bundle/`, `vendor/bundle/`, `Gemfile.lock`.

## Swamp Validation Commands

```bash
swamp extension source add . --only models
swamp extension fmt manifest.yaml --check
swamp doctor extensions --json
swamp model validate site-curation --json
swamp model method run site-curation build_daily_digest
swamp workflow validate daily-news --json
swamp workflow run daily-news
```

`OPENAI_API_KEY` is optional — omitting it uses feed excerpts without AI enrichment. Provide it via a swamp vault, environment variable, or GitHub Actions secret; never commit it.

## Verification Before Handoff

- **Template/content changes**: `docker compose run --rm jekyll bundle exec jekyll build`
- **Docker config changes**: `docker compose config && docker compose up -d jekyll && docker compose ps` — confirm `0.0.0.0:4000->4000/tcp`.
- **Swamp extension/model/workflow changes**: run the validation commands above, then `swamp workflow run daily-news` when network is available.

## Editing Guidelines

- `_data/links/` and `_data/sources/` are hand-curated — treat them as source data, not generated output.
- `_data/generated/news/*.yml`, `_news_days/*.html`, and `rss.xml` are generated but should be committed.
- Keep frontend UI compact/dashboard-like; avoid landing-page hero bloat.
- Keep Liquid simple and GitHub Pages-compatible.
- Do not edit the swamp-managed section at the top of this file.
