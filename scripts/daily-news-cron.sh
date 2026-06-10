#!/usr/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-${HOME}/alvagante.com}"
BRANCH="${BRANCH:-main}"
LOG_PREFIX="[alvagante-daily-news]"
LOCK_FILE="${LOCK_FILE:-/tmp/alvagante-daily-news.lock}"
NEWS_TIMEOUT="${NEWS_TIMEOUT:-50m}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-20m}"

export PATH="/usr/local/bin:/usr/bin:/bin:${PATH:-}"

log() {
  printf '%s %s %s
' "$(date -Is)" "$LOG_PREFIX" "$*"
}

run_with_timeout() {
  local duration="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout --kill-after=20m "$duration" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then
    gtimeout --kill-after=20m "$duration" "$@"
  else
    "$@"
  fi
}

cd "$REPO_DIR"

exec 9>"$LOCK_FILE"
if ! flock -n 9; then
  log "another run is already active; exiting"
  exit 0
fi

if [ -n "$(git status --porcelain)" ]; then
  log "worktree is dirty before generation; continuing anyway"
fi

log "updating $BRANCH"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

log "generating daily news digest"
set +e
run_with_timeout "$NEWS_TIMEOUT" swamp workflow run daily-news --timeout "$NEWS_TIMEOUT"
status=$?
set -e
if [ "$status" -ne 0 ]; then
  log "daily-news workflow failed or timed out with exit $status"
  exit "$status"
fi

log "verifying Jekyll build"
set +e
run_with_timeout "$BUILD_TIMEOUT" docker compose run --rm jekyll bundle exec jekyll build
status=$?
set -e
if [ "$status" -ne 0 ]; then
  log "Jekyll build failed or timed out with exit $status"
  exit "$status"
fi

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
