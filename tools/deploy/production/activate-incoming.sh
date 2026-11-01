#!/bin/bash
# Activates an uploaded Miu World release on .65. Root-owned; installed as /usr/local/sbin/miu-activate-incoming by
# setup-deploy-user.sh and refreshed by every manual `deploy.sh release`, which runs it too. It is the only command
# the CI user `miu-deploy` may run through sudo.
#   miu-activate-incoming <release-id>          release id: YYYYMMDD-HHMMSS-<first 12 hex of the commit>
# The release (tools/deploy/production/build-release.sh) waits in /opt/miu/incoming/<id>, writable by the deploy
# user. It is moved out of that user's reach before any check, must hold only plain files and directories in the
# release layout, with the server bundle, migrations, content and web index. Then, like the release always did:
# back up the database to /var/backups/miu/before-<id>.dump, switch /opt/miu/current, restart miu-server (the server
# runs pending migrations as it starts), wait for health on loopback and the site through nginx. On failure the
# previous release comes back and the script exits 1; migrations the new release ran are reported, never undone
# (restore before-<id>.dump by hand: docs/deployment-guide.md §5 Rollback). Unit, nginx, infra scripts and the env
# file are never taken from the upload: they change only through `deploy.sh setup`.
set -euo pipefail
umask 022
ROOT=/opt/miu
PORT=8797
DOMAIN=miu.hoandat.com
BACKUPS=/var/backups/miu
ID="${1:?usage: miu-activate-incoming <release-id>}"
[[ "$ID" =~ ^[0-9]{8}-[0-9]{6}-[0-9a-f]{12}$ ]] || { echo "bad release id" >&2; exit 2; }
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

# One activation at a time (a manual release and a CI deploy may meet).
exec 9>/run/miu-activate.lock
flock -w 900 9 || { echo "another activation still holds /run/miu-activate.lock" >&2; exit 1; }

SRC="$ROOT/incoming/$ID"
STAGE="$ROOT/staging"
DST="$ROOT/releases/$ID"
[ ! -e "$DST" ] || { echo "release $ID already exists" >&2; exit 2; }
[ -d "$SRC" ] && [ ! -L "$SRC" ] || { echo "incoming release $ID missing" >&2; exit 2; }

# Checks run only once the tree sits in a root-only directory, so the deploy user cannot swap a checked file for a
# link in between. Ownership and modes change only after the checks: a hard link to a host file must not be chowned.
install -d -m 700 -o root -g root "$STAGE"
T="$STAGE/$ID"
rm -rf "$T"
mv "$SRC" "$T"
trap 'rm -rf "$T"' EXIT
reject() { echo "incoming release $ID rejected: $1" >&2; exit 2; }
[ -z "$(find "$T" ! -type f ! -type d -print -quit)" ] || reject "links or special files"
[ -z "$(find "$T" -type f -links +1 -print -quit)" ] || reject "hard-linked files"
stray="$(find "$T" -mindepth 1 | sed "s|^$T/||" \
  | grep -Ev '^(apps|apps/web|apps/server|apps/server/dist|apps/web/dist(/.*)?|apps/server/dist/server(/.*)?|apps/server/drizzle(/.*)?|content(/.*)?)$' \
  | head -n 1 || true)"
[ -z "$stray" ] || reject "path outside the release layout: $stray"
for f in apps/web/dist/index.html apps/server/dist/server/index.mjs apps/server/drizzle/meta/_journal.json; do
  [ -f "$T/$f" ] || reject "no $f"
done
[ -d "$T/content" ] || reject "no content/"
chown -R root:root "$T"
find "$T" -type d -exec chmod 755 {} +
find "$T" -type f -exec chmod 644 {} +
# What the host shows as the running release: the commit (REVISION) and the release id, also served at /RELEASE.
printf '%s\n' "${ID##*-}" >"$T/apps/server/dist/server/REVISION"
printf '%s\n' "$ID" >"$T/apps/server/dist/server/RELEASE"
printf '%s\n' "$ID" >"$T/apps/web/dist/RELEASE"

echo "== backup database"
cd /tmp
runuser -u postgres -- pg_dump -Fc -f "$BACKUPS/before-$ID.dump" miu
[ -s "$BACKUPS/before-$ID.dump" ] || { echo "backup $BACKUPS/before-$ID.dump is empty" >&2; exit 1; }
echo "before-$ID.dump: $(stat -c %s "$BACKUPS/before-$ID.dump") bytes"

mv "$T" "$DST"
trap - EXIT

# Read-only count of the migrations Postgres has applied, to tell after a failure whether the new release ran any.
applied() { runuser -u postgres -- psql -d miu -At -c 'select count(*) from drizzle.__drizzle_migrations' 2>/dev/null || echo "?"; }

healthy() {
  local ok="" code served
  for _ in $(seq 1 30); do
    if curl -fsS --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then ok=1; break; fi
    sleep 1
  done
  [ -n "$ok" ] || { echo "no health on 127.0.0.1:$PORT within 30 s" >&2; return 1; }
  # Still up a few seconds later (a crash right after start restarts the unit in a loop).
  sleep 5
  if ! systemctl is-active -q miu-server || ! curl -fsS --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then
    echo "miu-server stopped answering after start" >&2; return 1
  fi
  code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 5 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/")"
  [ "$code" = 200 ] || { echo "origin https://$DOMAIN/ -> $code" >&2; return 1; }
  served="$(curl -fsSk --max-time 5 --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/RELEASE" | tr -d '\r\n')"
  [ "$served" = "$1" ] || { echo "origin serves release '$served', expected $1" >&2; return 1; }
}

echo "== switch and restart"
before="$(applied)"
prev="$(readlink "$ROOT/current" || true)"
ln -sfn "$DST" "$ROOT/current.new" && mv -T "$ROOT/current.new" "$ROOT/current"
systemctl restart miu-server || true

if ! healthy "$ID"; then
  # The server journal stays on the host when the CI user runs this (its output lands in a public Actions log).
  if [ -z "${SUDO_USER:-}" ]; then
    journalctl --namespace=miu -u miu-server -n 40 --no-pager
  else
    echo "server log: journalctl --namespace=miu -u miu-server on the host" >&2
  fi
  after="$(applied)"
  if [ -n "$prev" ]; then
    ln -sfn "$prev" "$ROOT/current.new" && mv -T "$ROOT/current.new" "$ROOT/current"
    systemctl restart miu-server || true
    echo "rolled back to $prev"
    for _ in $(seq 1 30); do curl -fsS --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 && break; sleep 1; done
    curl -fsS --max-time 2 "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1 \
      || echo "WARNING: the previous release does not answer health either" >&2
  else
    echo "no previous release to go back to" >&2
  fi
  if [ "$before" != "$after" ]; then
    echo "WARNING: migrations ran ($before -> $after applied) and were NOT undone; the previous release runs on the" \
      "migrated schema. To undo them restore $BACKUPS/before-$ID.dump (docs/deployment-guide.md §5 Rollback)." >&2
  fi
  exit 1
fi

# Keep the 5 newest releases (ids hold only digits, dashes and hex).
# shellcheck disable=SC2012
cd "$ROOT/releases" && ls -1t | tail -n +6 | xargs -r rm -rf
echo "healthy: $DOMAIN serves $ID (migrations applied: $(applied))"
