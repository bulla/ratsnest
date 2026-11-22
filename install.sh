#!/bin/sh
# Puts ratsnest on the PATH (ADR 0016): the executable for this system, from the repository's GitHub
# Releases, into ~/.local/bin, and `rnest` beside it, a link to it, the same command by a shorter name
# (ADR 0029). On Windows, download ratsnest-windows-x64.exe from the Releases page.
#
#   curl -fsSL https://raw.githubusercontent.com/bulla/ratsnest/develop/install.sh | sh
#
# RATSNEST_VERSION   a version to install, such as 0.1.0, rather than the latest
# RATSNEST_INSTALL   the folder to install into, rather than ~/.local/bin
# RATSNEST_FROM      an executable already on this machine, such as a local build, rather than a release
set -eu

repo="bulla/ratsnest"
version="${RATSNEST_VERSION:-latest}"
folder="${RATSNEST_INSTALL:-$HOME/.local/bin}"

case "$(uname -s)" in
  Linux) system=linux ;;
  Darwin) system=darwin ;;
  *)
    echo "ratsnest: on $(uname -s), download ratsnest from https://github.com/$repo/releases" >&2
    exit 1
    ;;
esac
case "$(uname -m)" in
  x86_64 | amd64) machine=x64 ;;
  arm64 | aarch64) machine=arm64 ;;
  *)
    echo "ratsnest: there is no ratsnest for $(uname -m); see https://github.com/$repo/releases" >&2
    exit 1
    ;;
esac
asset="ratsnest-$system-$machine"

mkdir -p "$folder"
partial="$folder/ratsnest.partial"
if [ -n "${RATSNEST_FROM:-}" ]; then
  cp "$RATSNEST_FROM" "$partial"
else
  if [ "$version" = latest ]; then
    url="https://github.com/$repo/releases/latest/download/$asset"
  else
    url="https://github.com/$repo/releases/download/v$version/$asset"
  fi
  curl -fsSL "$url" -o "$partial"
fi
chmod +x "$partial"
mv "$partial" "$folder/ratsnest"

# rnest, unless the name is already something else's.
short="$folder/rnest"
if { [ ! -e "$short" ] && [ ! -L "$short" ]; } || [ "$(readlink "$short" 2>/dev/null)" = ratsnest ]; then
  ln -sf ratsnest "$short"
  also=", also as rnest"
  names="\`rnest\` or \`ratsnest\`"
else
  echo "ratsnest: $short is something else already, so it is left alone, and only \`ratsnest\` is installed." >&2
  also=""
  names="\`ratsnest\`"
fi

echo "ratsnest $("$folder/ratsnest" --version) is in $folder$also."
case ":$PATH:" in
  *":$folder:"*) ;;
  *) echo "Add $folder to your PATH to run it as $names." ;;
esac
