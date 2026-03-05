# Docker + Tailscale 最短手順

`docker-compose.yaml` で `app` と `tailscale` を同時起動し、Tailscale 経由で Claw-Empire に HTTPS アクセスするための最短フローです。

## 1. `docker-setup.sh` で下準備

このスクリプトは Ubuntu 24 向けに、Docker / Compose と起動に必要なディレクトリを準備します。

```bash
bash docker-setup.sh
```

実施内容（要点）:

- Docker Engine / Docker Compose をインストール
- `db projects logs tailscale/state` を作成

## 2. `git clone`

※ フォークして使いたい場合は、先に GitHub で Fork してから自分のリポジトリ URL を `git clone` してください。

```bash
git clone https://github.com/yoheinishikubo/claw-empire.git
cd claw-empire
```

その後、必要なら `.env` を作成して値を入れます（例: `TS_AUTHKEY`, `TS_HOSTNAME`）。

`TS_AUTHKEY` の取得:

- URL: `https://login.tailscale.com/admin/settings/keys`
- 手順:
  1. Tailscale に管理者でログイン
  2. `Generate auth key` を押す
  3. 必要に応じて期限・再利用可否などを設定して発行
  4. 発行されたキーを `.env` の `TS_AUTHKEY=` に貼り付け

`TS_HOSTNAME` の設定:

- 用途: Tailnet 上でこのサーバーを識別するホスト名（`https://<TS_HOSTNAME>` でアクセス）
- 例: `TS_HOSTNAME=claw-empire-app`
- ルール: ほかの端末名と重複しない、わかりやすい名前にする

## 3. `npm run docker:up`

```bash
npm run docker:up
```

このコマンドで以下を一括実行します。

- 必要ディレクトリ作成（`db projects logs tailscale/state`）
- 現在ユーザーの UID/GID を渡して `docker compose up -d --build`

## よく使う停止・確認コマンド

```bash
npm run docker:down
npm run docker:logs
docker compose exec tailscale tailscale status
```
