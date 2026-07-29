#!/usr/bin/bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-${HOME}/alvagante.com}"
BRANCH="${BRANCH:-main}"
LOG_PREFIX="[alvagante-daily-news]"
LOCK_FILE="${LOCK_FILE:-/tmp/alvagante-daily-news.lock}"
NEWS_TIMEOUT="${NEWS_TIMEOUT:-50m}"
BUILD_TIMEOUT="${BUILD_TIMEOUT:-20m}"
GENERATED_PATHS=("_data/generated/news" "_news_days" "rss.xml")

export PATH="${HOME}/.local/bin:${HOME}/bin:${HOME}/.deno/bin:/usr/local/bin:/usr/bin:/bin:${PATH:-}"

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

push_branch() {
  if git push origin "$BRANCH"; then
    return 0
  fi

  log "push failed; rebasing onto origin/$BRANCH and retrying"
  git fetch origin "$BRANCH"
  git pull --rebase --autostash origin "$BRANCH"
  git push origin "$BRANCH"
}

publish_generated_changes() {
  local reason="$1"

  if [ -z "$(git status --porcelain -- "${GENERATED_PATHS[@]}")" ]; then
    log "no generated news changes to publish"
    return 0
  fi

  log "committing generated news changes (${reason})"
  git add -- "${GENERATED_PATHS[@]}"

  if git diff --cached --quiet -- "${GENERATED_PATHS[@]}"; then
    log "no staged changes after filtering generated outputs"
    return 0
  fi

  commit_date="$(date +%Y-%m-%d)"
  git commit --only -m "Generate daily news ${commit_date}" -- "${GENERATED_PATHS[@]}"

  log "pushing generated news changes"
  push_branch
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
if git rev-parse --verify "origin/$BRANCH" >/dev/null 2>&1; then
  ahead_count="$(git rev-list --count "origin/$BRANCH..$BRANCH")"
  if [ "$ahead_count" -gt 0 ]; then
    log "branch is ahead of origin/$BRANCH by ${ahead_count} commit(s); pushing first"
    push_branch
  fi
fi
git pull --ff-only --autostash origin "$BRANCH"

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
run_with_timeout "$BUILD_TIMEOUT" docker compose run --rm --no-deps --entrypoint sh jekyll -lc "bundle exec jekyll build"
status=$?
set -e
if [ "$status" -ne 0 ]; then
  log "Jekyll build failed or timed out with exit $status"
  exit "$status"
fi

publish_generated_changes "post-generation"

log "done"
