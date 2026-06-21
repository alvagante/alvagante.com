#!/usr/bin/env bash
set -euo pipefail

NAME="${PHOENIX_CONTAINER_NAME:-phoenix}"
REPO_DIR="${REPO_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
COMPOSE_FILE="${PHOENIX_COMPOSE_FILE:-docker-compose.phoenix.yml}"
COMPOSE_PROJECT_NAME="${PHOENIX_COMPOSE_PROJECT_NAME:-phoenix}"

export COMPOSE_PROJECT_NAME
export PHOENIX_CONTAINER_NAME="$NAME"

cleanup() {
  trap - INT TERM HUP QUIT EXIT
  echo "Signal received; stopping ${NAME}..."
  cd "$REPO_DIR"
  docker compose -f "$COMPOSE_FILE" stop phoenix >/dev/null 2>&1 || true
  exit 0
}
trap cleanup INT TERM HUP QUIT EXIT

if ! docker info >/dev/null 2>&1; then
  echo "Error: Docker daemon not reachable." >&2
  exit 1
fi

cd "$REPO_DIR"

if docker container inspect "$NAME" >/dev/null 2>&1 \
  && [ "$(docker inspect -f '{{.State.Running}}' "$NAME")" = "true" ]; then
  echo "Container ${NAME} is already running."
else
  echo "Creating or starting ${NAME}..."
  docker compose -f "$COMPOSE_FILE" up -d phoenix >/dev/null
fi

echo "Phoenix UI: http://${PHOENIX_BIND:-127.0.0.1}:${PHOENIX_PORT:-6006}"
echo "OTLP gRPC: http://${PHOENIX_GRPC_BIND:-127.0.0.1}:${PHOENIX_GRPC_PORT:-4317}"
echo "OTLP HTTP traces: http://${PHOENIX_BIND:-127.0.0.1}:${PHOENIX_PORT:-6006}/v1/traces"
echo "Running. Press Ctrl+C to stop ${NAME}."

while :; do
  sleep 86400
done
