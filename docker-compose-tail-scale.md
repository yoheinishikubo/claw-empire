# Docker + Tailscale 最短手順

`docker-compose.yaml` で `app` と `tailscale` を同時起動し、Tailscale 経由で Claw-Empire に HTTPS アクセスするための最短フローです。

## 1. Tailscale の概念

Tailscale は、WireGuard をベースにしたプライベートネットワーク構築サービスです。公開 IP を直接さらさずに、同じ Tailnet に参加している端末同士を安全に接続できます。

この構成での役割:

- `app`: Claw-Empire 本体
- `tailscale`: Tailnet に参加し、HTTPS の公開入口を作るコンテナ
- 利用者の端末: Tailscale にログインした PC / iPhone / Android から `https://<TS_HOSTNAME>` へアクセス

理解しておくとよいポイント:

- Tailnet: 自分の Tailscale アカウント配下の閉じたネットワーク
- `TS_AUTHKEY`: サーバーを Tailnet に参加させるための登録キー
- `TS_HOSTNAME`: Tailnet 内でこのサーバーを識別する名前
- HTTPS アクセス: Tailscale 側の仕組みを使って、外向けの複雑なリバースプロキシ設定なしで安全に到達できる

公式 URL:

- Web: `https://login.tailscale.com/start`
- iOS: `https://tailscale.com/download/ios`
- Android: `https://tailscale.com/download/android`

## 2. `docker-setup.sh` で下準備

このスクリプトは Ubuntu 24 向けに、Docker / Compose と起動に必要なディレクトリを準備します。

```bash
bash docker-setup.sh
```

実施内容（要点）:

- Docker Engine / Docker Compose をインストール
- `db projects logs tailscale/state` を作成

## 3. `git clone`

※ フォークして使いたい場合は、先に GitHub で Fork してから自分のリポジトリ URL を `git clone` してください。

```bash
git clone https://github.com/yoheinishikubo/claw-empire.git
cd claw-empire
```

その後、必要なら `.env` を作成して値を入れます（例: `TS_AUTHKEY`, `TS_HOSTNAME`, `API_AUTH_TOKEN`）。

`API_AUTH_TOKEN` の設定:

- 用途: 最初にアクセスした際に入力を求められるトークン。これがないとリモートからアクセスできない（ローカルホストからはアクセス可能）。
- 推奨: Tailscale によって一定のセキュリティは担保されるので、覚えやすい簡単な文字列で問題ありません。

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

## 4. `npm run docker:up`

```bash
npm run docker:up
```

このコマンドで以下を一括実行します。

- 必要ディレクトリ作成（`db projects logs tailscale/state`）
- 現在ユーザーの UID/GID を渡して `docker compose up -d --build`

## 5. `npm run url`

このコマンドでアクセス可能なURLを表示します。
アクセスできない場合、Tailscale の Web / iOS / Android いずれかでサインイン済みか、対象端末が同じ Tailnet に参加しているかを確認してください。

## よく使う停止・確認コマンド

```bash
npm run docker:down
npm run docker:logs
npm run url
```
