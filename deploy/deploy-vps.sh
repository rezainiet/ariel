#!/usr/bin/env bash
set -euo pipefail

release_id="${1:?release SHA required}"
[[ "$release_id" =~ ^[0-9a-f]{40}$ ]] || { echo 'Invalid release SHA' >&2; exit 1; }

base=/opt/ariel
archive="$base/incoming/$release_id.tar.gz"
release="$base/releases/$release_id"
test -f "$archive"
test -f /etc/systemd/system/ariel.service
test -s /etc/ariel/ariel.env

if [[ ! -d "$release" ]]; then
  staging="$(mktemp -d "$base/releases/.${release_id}.XXXXXX")"
  trap 'rm -rf -- "$staging"' EXIT
  tar -xzf "$archive" -C "$staging"
  (cd "$staging" && npm ci --omit=dev --ignore-scripts --no-audit --no-fund)
  test -f "$staging/dist/index.html"
  mv "$staging" "$release"
  trap - EXIT
fi
test -f "$release/dist/index.html"

previous="$(readlink "$base/current" || true)"
ln -s "$release" "$base/current.next"
mv -Tf "$base/current.next" "$base/current"

rollback() {
  echo 'Ariel health check failed; restoring previous release' >&2
  if [[ -n "$previous" ]]; then
    ln -s "$previous" "$base/current.next"
    mv -Tf "$base/current.next" "$base/current"
    sudo /bin/systemctl restart ariel.service || true
  else
    rm -f "$base/current"
    sudo /bin/systemctl stop ariel.service || true
  fi
  exit 1
}

sudo /bin/systemctl restart ariel.service || rollback
for attempt in {1..15}; do
  if curl --fail --silent --max-time 2 http://127.0.0.1:8787/ >/dev/null 2>&1 &&
     curl --fail --silent --max-time 2 http://127.0.0.1:8787/api/stock >/dev/null 2>&1; then
    sudo /bin/systemctl is-active ariel.service >/dev/null || rollback
    rm -f "$archive"
    echo "Ariel release $release_id is healthy"
    exit 0
  fi
  sleep 1
done
rollback
