# alvagante.com

Static Jekyll site for a compact personal link directory and daily AI-assisted news digests. Canonical public data lives in `_data/`; swamp automation fetches feeds and writes generated digest files under `_data/generated/news/`.

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

The `site-curation` model runs without an OpenAI key by using feed excerpts. To enable AI enrichment, provide `OPENAI_API_KEY` through a swamp vault or the GitHub Actions secret of the same name. Do not commit API keys.

## Data files

- `_data/links/<topic>/<category>.yml` files contain curated directory entries grouped by topic and category.
- `_data/news_sources.yml` contains enabled RSS/Atom sources.
- `_data/generated/news/YYYY-MM-DD.yml` contains generated daily digest data.
