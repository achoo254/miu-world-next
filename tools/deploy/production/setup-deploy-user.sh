#!/bin/bash
# Creates the restricted `miu-deploy` user GitHub Actions deploys Miu World with. Runs ON .65 as root, from the copy
# `deploy.sh deploy-user` ships (the public key comes on stdin):
#   bash setup-deploy-user.sh < miu-deploy.pub
# With empty stdin (`< /dev/null`, as `setup` does) it keeps the installed key and only reinstalls the sudo command.
# The user can only write /opt/miu/incoming and run one root-owned command through sudo:
# /usr/local/sbin/miu-activate-incoming <release-id> (activate-incoming.sh). It is not in group `miu`, so it cannot
# read /etc/miu/production.env, and owns nothing under /opt/miu besides incoming/.
set -euo pipefail
USER_NAME=miu-deploy
ROOT=/opt/miu
HERE="$(cd "$(dirname "$0")" && pwd)"
[ "$(id -u)" -eq 0 ] || { echo "run as root" >&2; exit 1; }

pub="$(cat)"
id "$USER_NAME" >/dev/null 2>&1 || useradd --create-home --shell /bin/bash "$USER_NAME"
home="$(getent passwd "$USER_NAME" | cut -d: -f6)"
if [ -n "$pub" ]; then
  [[ "$pub" =~ ^ssh-ed25519\ [A-Za-z0-9+/=]+(\ .*)?$ ]] || { echo "expected one ssh-ed25519 public key on stdin" >&2; exit 2; }
  install -d -m 700 -o "$USER_NAME" -g "$USER_NAME" "$home/.ssh"
  # `restrict`: no port/agent/X11 forwarding and no pty.
  printf 'restrict %s\n' "$pub" >"$home/.ssh/authorized_keys"
  chown "$USER_NAME:$USER_NAME" "$home/.ssh/authorized_keys"
  chmod 600 "$home/.ssh/authorized_keys"
elif [ ! -s "$home/.ssh/authorized_keys" ]; then
  echo "no key installed yet; pass the public key on stdin" >&2
  exit 2
fi

install -d -m 750 -o "$USER_NAME" -g "$USER_NAME" "$ROOT/incoming"
install -m 755 -o root -g root "$HERE/activate-incoming.sh" /usr/local/sbin/miu-activate-incoming.new
mv -f /usr/local/sbin/miu-activate-incoming.new /usr/local/sbin/miu-activate-incoming
printf '%s ALL=(root) NOPASSWD: /usr/local/sbin/miu-activate-incoming\n' "$USER_NAME" >/etc/sudoers.d/miu-deploy.new
chmod 440 /etc/sudoers.d/miu-deploy.new
visudo -cqf /etc/sudoers.d/miu-deploy.new || { rm -f /etc/sudoers.d/miu-deploy.new; echo "sudoers rule invalid" >&2; exit 1; }
mv -f /etc/sudoers.d/miu-deploy.new /etc/sudoers.d/miu-deploy
echo "setup-deploy-user: done"
