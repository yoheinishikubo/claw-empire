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

RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm@10.30.1 opencode-ai @google/gemini-cli @openai/codex

RUN groupadd -r claw && useradd -r -g claw -d /home/claw -m -s /bin/bash claw

COPY --chown=claw:claw --from=builder /usr/src/app .
RUN chown claw:claw /usr/src/app

ENV NODE_ENV=production
EXPOSE 8790
USER claw
RUN mkdir -p /usr/src/app/db && chown claw:claw /usr/src/app/db
RUN mkdir -p /usr/src/app/projects && chown claw:claw /usr/src/app/projects
RUN mkdir -p /usr/src/app/.agents && chown claw:claw /usr/src/app/.agents

CMD ["pnpm", "run", "start"]
