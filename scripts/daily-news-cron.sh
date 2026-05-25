#!/usr/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/home/al/alvagante.com}"
BRANCH="${BRANCH:-main}"
LOG_PREFIX="[alvagante-daily-news]"
LOCK_FILE="${LOCK_FILE:-/tmp/alvagante-daily-news.lock}"

export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

log() {
  printf '%s %s %s
' "$(date -Is)" "$LOG_PREFIX" "$*"
}

cd "$REPO_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another run is already active; exiting"
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  log "worktree is dirty before generation; refusing to run"
  git status --short
  exit 1
fi

log "updating $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

log "generating daily news digest"
swamp workflow run daily-news

log "verifying Jekyll build"
docker compose run --rm jekyll bundle exec jekyll build

if [ -z "$(git status --porcelain _data/generated/news rss.xml)" ]; then
  log "no generated news changes to publish"
  exit 0
fi

log "committing generated news changes"
git add _data/generated/news rss.xml

if git diff --cached --quiet; then
  log "no staged changes after filtering generated outputs"
  exit 0
fi

commit_date="$(date +%Y-%m-%d)"
git commit -m "Generate daily news ${commit_date}"

log "pushing generated news changes"
git push origin "$BRANCH"

log "done"
