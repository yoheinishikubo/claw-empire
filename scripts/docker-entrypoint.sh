#!/usr/bin/env bash
set -euo pipefail

log() {
  printf '[docker-entrypoint] %s\n' "$*"
}

ensure_dir() {
  mkdir -p "$1"
}

append_block_if_missing() {
  local file="$1"
  local marker="$2"
  local block="$3"

  touch "${file}"
  if grep -Fq "${marker}" "${file}"; then
    return 0
  fi

  if [[ -s "${file}" ]]; then
    printf '\n' >> "${file}"
  fi
  printf '%s\n' "${block}" >> "${file}"
}

detect_node_version() {
  local version_raw
  version_raw="$(node -p "const fs=require('node:fs'); const pkg=JSON.parse(fs.readFileSync('package.json','utf8')); (pkg.engines && pkg.engines.node) || '22'" 2>/dev/null || true)"
  if [[ "${version_raw}" =~ ([0-9]+([.][0-9]+){0,2}) ]]; then
    printf '%s\n' "${BASH_REMATCH[1]}"
  else
    printf '22\n'
  fi
}

detect_pnpm_version() {
  sed -nE 's/.*"packageManager"[[:space:]]*:[[:space:]]*"pnpm@([^"+]+).*/\1/p' package.json | head -n1
}

install_nvm_if_needed() {
  if [[ -s "${NVM_DIR}/nvm.sh" ]]; then
    return 0
  fi

  log "Installing nvm into ${NVM_DIR}"
  curl -fsSL "https://raw.githubusercontent.com/nvm-sh/nvm/${NVM_INSTALL_VERSION}/install.sh" | bash
}

load_nvm() {
  # shellcheck source=/dev/null
  . "${NVM_DIR}/nvm.sh"
}

ensure_node_runtime() {
  local target_node_version
  target_node_version="${CLAW_NODE_VERSION:-$(detect_node_version)}"

  if ! nvm ls "${target_node_version}" >/dev/null 2>&1; then
    log "Installing Node ${target_node_version} with nvm"
    nvm install "${target_node_version}"
  fi

  nvm alias default "${target_node_version}" >/dev/null
  nvm use default >/dev/null
}

ensure_pnpm_runtime() {
  local pnpm_version
  pnpm_version="$(detect_pnpm_version)"

  corepack enable >/dev/null 2>&1
  if [[ -n "${pnpm_version}" ]]; then
    corepack prepare "pnpm@${pnpm_version}" --activate >/dev/null 2>&1
  else
    corepack prepare pnpm@latest --activate >/dev/null 2>&1
  fi
}

ensure_optional_clis() {
  if [[ "${CLAW_SKIP_CLI_BOOTSTRAP:-0}" == "1" ]]; then
    return 0
  fi

  local npm_packages=()
  command -v codex >/dev/null 2>&1 || npm_packages+=("@openai/codex")
  command -v gemini >/dev/null 2>&1 || npm_packages+=("@google/gemini-cli")
  command -v opencode >/dev/null 2>&1 || npm_packages+=("opencode-ai")

  if [[ "${#npm_packages[@]}" -gt 0 ]]; then
    log "Installing user-scoped CLI tools: ${npm_packages[*]}"
    npm install -g "${npm_packages[@]}"
  fi

  if ! command -v claude >/dev/null 2>&1; then
    log "Installing Claude CLI into ${HOME}"
    curl -fsSL https://claude.ai/install.sh | bash
  fi
}

ensure_shell_init() {
  local marker="# >>> claw nvm >>>"
  local block
  block="$(cat <<'EOF'
# >>> claw nvm >>>
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
export PNPM_HOME="${PNPM_HOME:-$HOME/.local/share/pnpm}"
export PATH="$HOME/.local/bin:$PNPM_HOME:$NVM_DIR/current/bin:$PATH"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
fi
# <<< claw nvm <<<
EOF
)"

  append_block_if_missing "${HOME}/.bashrc" "${marker}" "${block}"

  local bash_profile_marker="# >>> claw bash_profile >>>"
  local bash_profile_block
  bash_profile_block="$(cat <<'EOF'
# >>> claw bash_profile >>>
if [ -f "$HOME/.bashrc" ]; then
  . "$HOME/.bashrc"
fi
# <<< claw bash_profile <<<
EOF
)"
  append_block_if_missing "${HOME}/.bash_profile" "${bash_profile_marker}" "${bash_profile_block}"
}

export HOME="${HOME:-/home/claw}"
export USER="${USER:-claw}"
export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
export NVM_SYMLINK_CURRENT="${NVM_SYMLINK_CURRENT:-true}"
export XDG_CONFIG_HOME="${XDG_CONFIG_HOME:-${HOME}/.config}"
export XDG_DATA_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}"
export XDG_STATE_HOME="${XDG_STATE_HOME:-${HOME}/.local/state}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-${HOME}/.cache}"
export PNPM_HOME="${PNPM_HOME:-${HOME}/.local/share/pnpm}"
export COREPACK_HOME="${COREPACK_HOME:-${XDG_CACHE_HOME}/node/corepack}"
export NVM_INSTALL_VERSION="${NVM_INSTALL_VERSION:-v0.40.4}"
export PATH="${HOME}/.local/bin:${PNPM_HOME}:${NVM_DIR}/current/bin:${PATH}"

ensure_dir "${HOME}"
ensure_dir "${NVM_DIR}"
ensure_dir "${HOME}/.local/bin"
ensure_dir "${XDG_CONFIG_HOME}"
ensure_dir "${XDG_DATA_HOME}"
ensure_dir "${XDG_STATE_HOME}"
ensure_dir "${XDG_CACHE_HOME}"
ensure_dir "${PNPM_HOME}"
ensure_dir "${COREPACK_HOME}"

install_nvm_if_needed
load_nvm
ensure_node_runtime
ensure_pnpm_runtime
ensure_optional_clis
ensure_shell_init

log "Using node $(node -v) from $(command -v node)"
exec "$@"
