#!/usr/bin/env bash

docker compose exec -it app sh -c "npm install -g pnpm opencode-ai @google/gemini-cli @openai/codex"
docker compose exec -it app sh -c "curl -fsSL https://claude.ai/install.sh | bash"
