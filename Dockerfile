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

RUN apt-get update && apt-get install -y git curl python jq ripgrep && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1
# RUN npm install -g pnpm@10.30.1 opencode-ai @google/gemini-cli @openai/codex

ARG UID=1000
ARG GID=1000
ENV UID=${UID}
ENV GID=${GID}

COPY --from=builder /usr/src/app .
RUN mkdir -p /home/claw /usr/src/app/db /usr/src/app/projects /usr/src/app/.agents \
  && chown -R ${UID}:${GID} /usr/src/app /home/claw

ENV NODE_ENV=production
ENV HOME=/home/claw
EXPOSE 8790
USER ${UID}:${GID}
ENV PATH="${HOME}/.local/bin:${PATH}"
# RUN curl -fsSL https://claude.ai/install.sh | bash


CMD ["pnpm", "run", "start"]
