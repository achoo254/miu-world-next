# Release gate sourced by tools/deploy/production/deploy.sh (not run on its own): a release goes out only when CI
# passed on the commit being released (docs/deployment-guide.md). Screens are no longer pictured and reviewed before a
# release (owner 29/10/2026); `pnpm --filter @miu/web screens` stays available for a look by hand.
#   MIU_RELEASE_FORCE="<reason>"  lets an urgent fix through (CI broken for a reason outside the code): the reason is
#                                 printed and written beside REVISION in the release as RELEASE_FORCED.
#   MIU_RELEASE_REV               the commit of a tree exported without .git (`git archive`).
#   MIU_GH_REPO                   the GitHub repository whose CI is asked (default achoo254/miu-world-next).
# Sets RELEASE_FORCED (the reason, or empty) for the caller.

# Read by the deploy script that sources this file.
# shellcheck disable=SC2034
RELEASE_FORCED=""

# Prints why the release is held and returns 1, or prints "được" and returns 0. Run from the root of a checkout, or
# of a tree exported from a commit (`git archive`, no .git) with MIU_RELEASE_REV naming that commit.
release_gate() {
  if [ -n "${MIU_RELEASE_FORCE:-}" ]; then
    # shellcheck disable=SC2034  # read by the deploy script that sources this file
    RELEASE_FORCED="$MIU_RELEASE_FORCE"
    echo "được (ép): bỏ qua cổng release vì: $MIU_RELEASE_FORCE"
    return 0
  fi

  local commit
  if git rev-parse --git-dir >/dev/null 2>&1; then
    commit="$(git rev-parse HEAD)"
  else
    commit="${MIU_RELEASE_REV:-}"
    [ -n "$commit" ] || { echo "chặn: cây không có .git: đặt MIU_RELEASE_REV là sha của commit đã export" >&2; return 1; }
  fi

  local repo="${MIU_GH_REPO:-achoo254/miu-world-next}" runs
  runs="$(gh run list -R "$repo" --workflow ci --commit "$commit" --json status,conclusion,url --limit 5 2>/dev/null)" \
    || { echo "chặn: không hỏi được CI qua gh (gh auth status; mạng)" >&2; return 1; }
  local ci
  # shellcheck disable=SC2016  # JavaScript for node, not shell
  ci="$(node -e '
    const runs = JSON.parse(process.argv[1]);
    if (runs.length === 0) { console.log("none -"); process.exit(0); }
    const done = runs.find((r) => r.status === "completed" && r.conclusion === "success");
    const latest = runs[0];
    console.log(done ? `success ${done.url}` : `${latest.status === "completed" ? latest.conclusion : latest.status} ${latest.url}`);
  ' "$runs")"
  local state url
  read -r state url <<<"$ci"
  case "$state" in
    success) ;;
    none) echo "chặn: CI chưa chạy cho ${commit:0:8}; push commit đó và đợi CI" >&2; return 1 ;;
    queued | in_progress | waiting | pending | requested) echo "chặn: CI của ${commit:0:8} đang chạy ($state): $url" >&2; return 1 ;;
    *) echo "chặn: CI đỏ ở ${commit:0:8} ($state): $url" >&2; return 1 ;;
  esac

  echo "được: CI xanh ở ${commit:0:8}: $url"
}
