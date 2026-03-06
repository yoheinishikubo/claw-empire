FROM node:22-bullseye-slim AS builder
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN bash install.sh
RUN pnpm run build

FROM node:22-bullseye-slim AS runner
WORKDIR /usr/src/app

RUN apt-get update && apt-get install -y \
  bash \
  ca-certificates \
  curl \
  git \
  jq \
  libatomic1 \
  python3 \
  python-is-python3 \
  ripgrep \
  xz-utils \
  && rm -rf /var/lib/apt/lists/*

ARG UID=1000
ARG GID=1000
ENV UID=${UID}
ENV GID=${GID}

COPY --from=builder /usr/src/app ./
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
  set -eux; \
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
  mkdir -p /home/claw /usr/src/app/db /usr/src/app/projects /usr/src/app/.agents /usr/src/app/logs; \
  chown -R claw:claw /usr/src/app /home/claw

ENV NODE_ENV=production
ENV HOME=/home/claw
ENV USER=claw
ENV NVM_DIR=/home/claw/.nvm
ENV NVM_SYMLINK_CURRENT=true
ENV XDG_CONFIG_HOME=/home/claw/.config
ENV XDG_DATA_HOME=/home/claw/.local/share
ENV XDG_STATE_HOME=/home/claw/.local/state
ENV XDG_CACHE_HOME=/home/claw/.cache
ENV PNPM_HOME=/home/claw/.local/share/pnpm
ENV COREPACK_HOME=/home/claw/.cache/node/corepack
ENV PATH=/home/claw/.local/bin:/home/claw/.local/share/pnpm:/home/claw/.nvm/current/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

EXPOSE 8790
USER claw
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["pnpm", "run", "start"]
