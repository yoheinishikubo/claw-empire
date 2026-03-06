FROM node:22-bullseye-slim as builder
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1



COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN bash install.sh
RUN pnpm run build

FROM node:22-bullseye-slim as runner
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y git curl python jq ripgrep libatomic1 && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1
# RUN npm install -g pnpm@10.30.1 opencode-ai @google/gemini-cli @openai/codex

ARG UID=1000
ARG GID=1000
ENV UID=${UID}
ENV GID=${GID}

COPY --from=builder /usr/src/app .
RUN set -eux; \
  group_by_gid="$(getent group "${GID}" | cut -d: -f1 || true)"; \
  if [ -n "${group_by_gid}" ]; then \
    if [ "${group_by_gid}" != "claw" ]; then \
      groupmod --new-name claw "${group_by_gid}"; \
    fi; \
  elif getent group claw >/dev/null; then \
    groupmod --gid "${GID}" claw; \
  else \
    groupadd --gid "${GID}" claw; \
  fi; \
  user_by_uid="$(getent passwd "${UID}" | cut -d: -f1 || true)"; \
  if [ -n "${user_by_uid}" ]; then \
    if [ "${user_by_uid}" != "claw" ]; then \
      usermod --login claw --home /home/claw --move-home --gid "${GID}" --shell /bin/bash "${user_by_uid}"; \
    fi; \
  elif getent passwd claw >/dev/null; then \
    usermod --uid "${UID}" --gid "${GID}" --home /home/claw --move-home --shell /bin/bash claw; \
  else \
    useradd --uid "${UID}" --gid "${GID}" --create-home --home-dir /home/claw --shell /bin/bash claw; \
  fi; \
  mkdir -p /home/claw /usr/src/app/db /usr/src/app/projects /usr/src/app/.agents; \
  chown -R claw:claw /usr/src/app /home/claw

ENV NODE_ENV=production
ENV HOME=/home/claw
ENV NVM_DIR=/home/claw/.nvm
ENV NVM_SYMLINK_CURRENT=true

EXPOSE 8790
USER claw
SHELL ["/bin/bash", "-c"]
ENV PATH="${HOME}/.local/bin:${NVM_DIR}/current/bin:${PATH}"
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
RUN source "${NVM_DIR}/nvm.sh" && nvm install node && npm install -g pnpm@10.30.1 opencode-ai @google/gemini-cli @openai/codex
RUN curl -fsSL https://claude.ai/install.sh | bash


CMD ["pnpm", "run", "start"]
