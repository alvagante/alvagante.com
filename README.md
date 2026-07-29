# alvagante.com

Static Jekyll site for a compact personal link directory and daily AI-assisted news digests. Canonical public data lives in `_data/`; swamp automation fetches feeds and writes generated digest files under `_data/generated/news/`, plus a thin per-date page stub under `_news_days/` so each digest date gets its own lazily-loaded page at `/news/<date>/`.

## Local site

Run Jekyll through Docker so the host does not need Ruby or Bundler:

```bash
docker compose up jekyll
```

Jekyll binds to `0.0.0.0` inside the container and Compose publishes `0.0.0.0:4000:4000`, so on a remote node open `http://<remote-host>:4000/`. LiveReload is also published on port `35729`. The container keeps gems in the `bundle-cache` Docker volume and uses incremental Jekyll rebuilds for faster checks.

For a one-off build without serving:

```bash
docker compose run --rm jekyll bundle exec jekyll build
```

## Daily news automation

```bash
swamp extension source add . --only models
swamp workflow run daily-news
```

For host-level cron automation, use the repo script:

```cron
17 6 * * * REPO_DIR=/home/al/alvagante.com /home/al/alvagante.com/scripts/daily-news-cron.sh >> /home/al/alvagante.com-daily-news.log 2>&1
```

The script fast-forwards `main`, runs `swamp workflow run daily-news`, verifies the site with Docker, commits changed generated news files, `_news_days/` stubs, and `rss.xml`, and pushes back to GitHub. It refuses to run if the worktree is dirty before generation.

The `site-curation` model runs without an OpenAI key by using feed excerpts. To enable AI enrichment, provide `OPENAI_API_KEY` through a swamp vault, environment variable, or the GitHub Actions secret of the same name. Do not commit API keys.

## Data files

- `_data/links/<topic>/<category>.yml` files contain curated directory entries grouped by topic and category.
- `_data/sources/<category>.yml` contains enabled RSS/Atom sources by news category.
- `_data/generated/news/YYYY-MM-DD.yml` contains generated daily digest data.
- `_news_days/YYYY-MM-DD.html` is a thin per-date stub (a Jekyll collection doc) that gives that digest date its own page at `/news/YYYY-MM-DD/`, fetched on demand by the date picker on `/news/`.
