#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Setup Docker + nvm/Node environment for Claw-Empire (Ubuntu 24 only).

Usage:
  bash docker-setup.sh [options]

Options:
  --dry-run           Print commands without executing them
  --skip-docker       Skip Docker setup
  --skip-node         Skip nvm/Node setup
  --node-version VER  Override Node major/minor version (default: from package.json engines.node)
  -h, --help          Show this help
EOF
}

log() {
  printf '[setup] %s\n' "$*"
}

die() {
  printf '[setup] ERROR: %s\n' "$*" >&2
  exit 1
}

has_cmd() {
  command -v "$1" >/dev/null 2>&1
}

run_cmd() {
  if [[ "${DRY_RUN}" == "1" ]]; then
    printf '+ %q' "$1"
    shift || true
    for arg in "$@"; do
      printf ' %q' "${arg}"
    done
    printf '\n'
    return 0
  fi
  "$@"
}

run_shell() {
  local script="$1"
  if [[ "${DRY_RUN}" == "1" ]]; then
    printf '+ bash -lc %q\n' "${script}"
    return 0
  fi
  bash -lc "${script}"
}

run_privileged_cmd() {
  if [[ "${EUID}" -eq 0 ]]; then
    run_cmd "$@"
    return 0
  fi

  if has_cmd sudo; then
    run_cmd sudo "$@"
    return 0
  fi

  die "sudo is required for privileged command: $*"
}

run_privileged_shell() {
  local script="$1"
  if [[ "${EUID}" -eq 0 ]]; then
    run_shell "${script}"
    return 0
  fi

  if has_cmd sudo; then
    if [[ "${DRY_RUN}" == "1" ]]; then
      printf '+ sudo bash -lc %q\n' "${script}"
      return 0
    fi
    sudo bash -lc "${script}"
    return 0
  fi

  die "sudo is required for privileged shell command."
}

detect_node_version_from_package() {
  local node_major
  node_major="$(sed -nE 's/.*"node"[[:space:]]*:[[:space:]]*">=([0-9]+).*/\1/p' package.json | head -n1 || true)"
  if [[ -n "${node_major}" ]]; then
    printf '%s\n' "${node_major}"
  else
    printf '22\n'
  fi
}

detect_pnpm_version_from_package() {
  local pnpm_version
  pnpm_version="$(sed -nE 's/.*"packageManager"[[:space:]]*:[[:space:]]*"pnpm@([^"+]+).*/\1/p' package.json | head -n1 || true)"
  printf '%s\n' "${pnpm_version}"
}

ensure_ubuntu24() {
  [[ -f /etc/os-release ]] || die "/etc/os-release not found."
  # shellcheck source=/dev/null
  . /etc/os-release

  if [[ "${ID:-}" != "ubuntu" ]]; then
    die "This script supports Ubuntu 24 only. Detected: ${ID:-unknown}"
  fi
  if [[ ! "${VERSION_ID:-}" =~ ^24(\.|$) ]]; then
    die "This script supports Ubuntu 24 only. Detected VERSION_ID=${VERSION_ID:-unknown}"
  fi

  UBUNTU_CODENAME="${VERSION_CODENAME:-noble}"
  UBUNTU_ARCH="$(dpkg --print-architecture)"
}

install_docker_ubuntu24() {
  has_cmd apt-get || die "apt-get is required on Ubuntu."
  has_cmd dpkg || die "dpkg is required on Ubuntu."

  log "Installing Docker Engine/Compose from official Docker APT repo..."
  run_privileged_cmd apt-get update
  run_privileged_cmd apt-get install -y ca-certificates curl gnupg
  run_privileged_cmd install -m 0755 -d /etc/apt/keyrings
  run_privileged_shell 'curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg'
  run_privileged_cmd chmod a+r /etc/apt/keyrings/docker.gpg
  run_privileged_shell "echo \"deb [arch=${UBUNTU_ARCH} signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME} stable\" > /etc/apt/sources.list.d/docker.list"
  run_privileged_cmd apt-get update
  run_privileged_cmd apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

  if has_cmd systemctl; then
    run_privileged_shell 'systemctl enable --now docker || true'
  fi

  if [[ "${EUID}" -ne 0 ]] && ! id -nG "${USER}" | tr ' ' '\n' | grep -qx 'docker'; then
    log "Adding ${USER} to docker group (requires new login session to take effect)."
    run_privileged_cmd usermod -aG docker "${USER}"
    DOCKER_GROUP_UPDATED="1"
  fi
}

load_nvm() {
  export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
  if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
    die "nvm not found at ${NVM_DIR}/nvm.sh"
  fi
  # shellcheck source=/dev/null
  . "${NVM_DIR}/nvm.sh"
}

install_nvm_and_node() {
  local nvm_install_version="v0.40.3"

  export NVM_DIR="${NVM_DIR:-${HOME}/.nvm}"
  if [[ ! -s "${NVM_DIR}/nvm.sh" ]]; then
    has_cmd curl || die "curl is required to install nvm."
    log "Installing nvm (${nvm_install_version})..."
    run_shell "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/${nvm_install_version}/install.sh | bash"
  else
    log "nvm already installed at ${NVM_DIR}"
  fi

  if [[ "${DRY_RUN}" == "1" ]]; then
    printf '+ source %q && nvm install %q && nvm alias default %q && nvm use default\n' "${NVM_DIR}/nvm.sh" "${TARGET_NODE_VERSION}" "${TARGET_NODE_VERSION}"
  else
    load_nvm
    nvm install "${TARGET_NODE_VERSION}"
    nvm alias default "${TARGET_NODE_VERSION}"
    nvm use default >/dev/null
  fi

  log "Enabling corepack..."
  run_cmd corepack enable

  local pnpm_version
  pnpm_version="$(detect_pnpm_version_from_package)"
  if [[ -n "${pnpm_version}" ]]; then
    log "Activating pnpm@${pnpm_version} via corepack..."
    run_cmd corepack prepare "pnpm@${pnpm_version}" --activate
  else
    log "Activating latest pnpm via corepack..."
    run_cmd corepack prepare pnpm@latest --activate
  fi
}

SKIP_DOCKER=0
SKIP_NODE=0
DRY_RUN=0
DOCKER_GROUP_UPDATED=0
TARGET_NODE_VERSION=""
UBUNTU_CODENAME=""
UBUNTU_ARCH=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --skip-docker)
      SKIP_DOCKER=1
      shift
      ;;
    --skip-node)
      SKIP_NODE=1
      shift
      ;;
    --node-version)
      [[ $# -ge 2 ]] || die "Missing value for --node-version"
      TARGET_NODE_VERSION="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

if [[ ! -f package.json ]]; then
  die "Run this script from the repository root (package.json not found)."
fi

if [[ -z "${TARGET_NODE_VERSION}" ]]; then
  TARGET_NODE_VERSION="$(detect_node_version_from_package)"
fi

ensure_ubuntu24
log "Detected OS: Ubuntu ${VERSION_ID:-24}"
log "Target Node version: ${TARGET_NODE_VERSION}"

if [[ "${SKIP_DOCKER}" == "0" ]]; then
  install_docker_ubuntu24
else
  log "Skipping Docker setup."
fi

if [[ "${SKIP_NODE}" == "0" ]]; then
  install_nvm_and_node
else
  log "Skipping nvm/Node setup."
fi

log "Ensuring docker-compose bind mount directories exist..."
run_cmd mkdir -p db projects logs tailscale/state

log "Setup completed."
if [[ "${DOCKER_GROUP_UPDATED}" == "1" ]]; then
  log "Re-login (or reboot) is required before running docker without sudo."
fi
log "Next step: bash install.sh"
