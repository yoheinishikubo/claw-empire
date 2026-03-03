# Docker Compose / Dockerfile のまとめ

## 概要
- `docker compose` は `app`（Claw-Empire本体）と `tailscale`（Tailscale経由で外部公開）の2サービスを、同じブリッジネットワーク `clawnet` 上で起動します。
- `app` サービスはマルチステージの `Dockerfile` でビルドされ、`pnpm run build` の成果物を `pnpm run start` で実行します。
- `tailscale` サービスは `app` コンテナに HTTPS 経由でアクセスできるよう、Tailscaleネットワークを組み合わせて公開します。

## Dockerfile のポイント
- builder ステージ（`node:22-bullseye-slim`）
  - `pnpm@10.30.1` をグローバルインストールし、`pnpm install --frozen-lockfile` で依存を展開。
  - `install.sh`（`scripts/openclaw-setup.sh` を呼び出し）で OpenClaw の初期設定を完了後、`pnpm run build`。
- runner ステージ
  - 同バージョンの Node + pnpm に加え、`opencode-ai` CLI をグローバルインストール。
  - `claw` ユーザーを作成し、`/home/claw/.config/opencode` 以下を確保。ビルド成果物を `claw` 所有でコピー。
  - `NODE_ENV=production`、ポート `8790` を公開し、`pnpm run start` でサーバーを起動。

## `docker-compose.yaml` の構成
### app
- イメージは上記 Dockerfile。`restart: unless-stopped` で自動復旧。
- `.env` ファイル（存在すれば）を `env_file` で読み込み、`HOST=0.0.0.0` `PORT=8790` を明示。
- `ports: "8790:8790"` でホスト→コンテナのトラフィックを許可。
- `volumes` によって以下をマウント：
  - `./config/opencode.json:/home/claw/.config/opencode/opencode.json:ro`（OpenCode CLI/プロバイダー設定。実運用では `KIMI_API_KEY` などを埋めたファイルと差し替える）
  - `./AGENTS.md:/usr/src/app/AGENTS.md:ro`（CEO指示・エージェントルール。内容を更新したらホスト側を上書きして再起動してください）
- `networks: clawnet` で `tailscale` との通信を確保。

### tailscale
- 公式イメージ `tailscale/tailscale:latest` を使用。
- `NET_ADMIN`/`NET_RAW` 権限と `/dev/net/tun` デバイスをコンテナに付与。
- `volumes` で `./tailscale/state:/var/lib/tailscale` をマウントし、`tailscaled.state` を永続化。
- 環境変数（`.env` に定義可能）：
  - `TS_AUTHKEY`（必須）：Tailscale auth key（有効期限付きのキー）。`tailscale up` に渡されます。
  - `TAILSCALE_HOSTNAME`（省略時 `claw-empire-app`）。
  - `TS_STATE_DIR`（デフォルト `/var/lib/tailscale`）。
  - `TS_EXTRA_ARGS`：`tailscale up` に追加の引数。デフォルトではホスト名を渡す。
- `command` では `tailscaled` をバックグラウンド起動し、`tailscale up` → `tailscale serve --https=443 --set-path=/ --yes http://app:8790` で HTTPS リレーを設定。最後に `tail -f /dev/null` でプロセスを維持。
- `tailscale serve reset || true` → `tailscale serve status` で状態を出力するので、ログで HTTPS が正しく設定されたか確認可能。

## 起動手順（例）
1. `.env` を用意（存在しない場合は `.env.example` をコピー）。必要な値は `OAUTH_ENCRYPTION_SECRET`、`INBOX_WEBHOOK_SECRET`、必要な OAuth / API キー。
2. `TS_AUTHKEY` を `.env` に追加。Tailscale admin console から一時キーを取得。
3. `config/opencode.json` の `model`/`provider` を自分の API キー（例：`KIMI_API_KEY`）に合わせて更新。ホスト側で編集し、再起動すればコンテナ側へ反映。
4. `docker compose build` でイメージをビルド。
5. `docker compose up --detach` で `app`/`tailscale` を起動。
6. `docker compose logs -f app` や `docker compose logs -f tailscale` で挙動を確認。
7. `tailscale status` を実行して Tailscale 接続と `serve` の状態をチェック（`tailscale` コンテナ内でコマンド実行が必要）。

## よく使うコマンド
- `docker compose up --detach --build`
- `docker compose down`（ネットワーク/ボリュームごと停止）
- `docker compose restart app`
- `docker compose restart tailscale`
- `docker compose logs -f app`
- `docker compose logs -f tailscale`
- `docker compose exec tailscale tailscale status`

## トラブルシューティング
- **Tailscale auth key がない/期限切れ**：`TS_AUTHKEY` を再生成し、コンテナを再起動。`tailscale up` 失敗ログ（`tailscale` ログ）を確認。
- **`/dev/net/tun` にアクセスできない**：Mac/Windows の Docker Desktop ではデバイスをマウントできない場合があります。Linuxホストで `docker compose` を実行するか、Tailscale サービスを削除してネットワーク越しにアクセスしてください。
- **OpenCode 用の `config/opencode.json` にキーが入っていない**：`{env:KIMI_API_KEY}` プレースホルダーのままでは CLI 認証できないため、実際の `KIMI_API_KEY` を `.env` に定義し、`config/opencode.json` をホスト側で書き換えてリスタート。
- **AGENTS.md を修正したが反映されない**：`app` コンテナは `AGENTS.md` を読み取り専用マウントしているので、ホスト側のファイルを上書き→`docker compose restart app`
- **ポート 8790 が競合する**：他プロセスと重複している場合、`HOST`/`PORT` を `.env` で変更するか、利用中のプロセスを停止してから起動。

## 補足
- `tailscale` サービスが HTTPS 443 を公開するため、Tailscale クライアント経由で `https://<自分の hostname>` にアクセスして Claw-Empire フロントエンドを利用できます（`tailscale serve status` でパスが `http://app:8790` へリレーされていることを確認）。
- Docker イメージ内には `opencode-ai` CLI と `pnpm` が既に入っているので、ホストで追加インストールする必要はありません。
- ネットワーク `clawnet` や `/tailscale/state` は Compose が自動作成しますが、削除して再起動したい場合は `docker compose down --volumes` を使って state を初期化できます。

