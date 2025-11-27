# AI QA Lounge

GAISメルマガ購読者向けの動画コンテンツ質問コミュニティプラットフォーム

## プロジェクト概要

YouTube動画を視聴したメルマガ購読者が質問を投稿し、RAG（Retrieval-Augmented Generation）で動画字幕から関連情報を検索してAIが回答を生成するQ&Aプラットフォームです。

### 主な機能

- エピソード管理（YouTube動画登録・字幕取得・ベクトル化）
- パーソナライズURL生成（メール配信用）
- ユーザーQ&A（質問投稿・RAG回答生成）
- コミュニティ機能（他のユーザーの質問閲覧）

## 技術スタック

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js Server Actions / API Routes
- **Database**: Turso (libSQL) + Drizzle ORM（リレーショナル + ベクトル統合）
- **AI/RAG**: Vercel AI SDK + OpenAI
- **Vector Search**: Turso libSQL vector (F32_BLOB)
- **認証**: シンプル認証（user_idベース）
- **デプロイ**: Vercel + Turso Cloud

## アーキテクチャ

### シングルDB アーキテクチャ（Turso libSQL vector）

Turso libSQL 単体でリレーショナルデータとベクトルデータを管理：

- **リレーショナルデータ**: episodes, users, questions, answers, user_profiles
- **ベクトルデータ**: video_captions.embedding (F32_BLOB(1536))

メリット：
- ✅ DB 1つだけで完結（Redis 不要、Docker 不要）
- ✅ コスト $0（Turso 無料プランのみ）
- ✅ 型安全性（Drizzle の TypeScript ファースト ORM）
- ✅ Edge対応（Vercel Edge Functions で直接利用可能）

## ローカル開発

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local`ファイルを作成：

```bash
# Turso Database (ローカル開発用)
TURSO_DATABASE_URL=file:local.db

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin認証
ADMIN_PASSWORD=your_secure_admin_password
```

### 3. データベースのセットアップ

```bash
# スキーマを直接DBにプッシュ（開発時）
npm run db:push

# または、マイグレーションを生成して実行
npm run db:generate
npm run db:migrate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## データベース管理

Drizzle ORMを使用したデータベース操作：

- `npm run db:generate` - スキーマ変更からマイグレーションファイルを生成
- `npm run db:push` - スキーマ変更を直接DBにプッシュ（開発用）
- `npm run db:migrate` - マイグレーションを実行
- `npm run db:studio` - Drizzle Studioを開いてDBを管理

## 本番環境セットアップ（Turso Cloud）

### 1. Turso CLIのインストール

```bash
brew install tursodatabase/tap/turso
```

### 2. Tursoにログイン

```bash
turso auth login
```

### 3. データベースの作成

```bash
turso db create ai-qa-lounge-prod
```

### 4. 認証情報の取得

```bash
# データベースURL
turso db show ai-qa-lounge-prod --url

# 認証トークン
turso db tokens create ai-qa-lounge-prod
```

### 5. Vercelに環境変数を設定

```bash
vercel env add TURSO_DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel env add OPENAI_API_KEY
```

## プロジェクト構造

```
ai-qa-lounge/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # 管理画面
│   ├── room/              # ユーザーQ&Aルーム
│   └── page.tsx           # トップページ
├── db/                    # データベース
│   ├── schema.ts          # Drizzle スキーマ定義
│   └── index.ts           # DBクライアント
├── lib/                   # ユーティリティ
│   ├── youtube/           # YouTube字幕取得
│   └── rag/               # RAG検索・回答生成
├── migrations/            # マイグレーションファイル
└── drizzle.config.ts      # Drizzle設定
```

## 開発フェーズ

### Phase 1: プロジェクトセットアップ ✅ 完了

- [x] Next.js + Turso + Drizzle プロジェクト作成
- [x] ベクトル対応スキーマ定義
- [x] AI/RAGパッケージインストール
- [x] データベーステーブル作成

### Phase 2: YouTube RAGパイプライン（次のステップ）

- [ ] YouTube字幕取得機能
- [ ] ベクトル化パイプライン
- [ ] 管理画面API（エピソード登録）

### Phase 3: ユーザーQ&A機能

- [ ] RAG検索機能
- [ ] 回答生成機能
- [ ] Q&A UI実装

### Phase 4: 管理画面 & デプロイ

- [ ] 管理画面UI
- [ ] パーソナライズURL生成
- [ ] 本番デプロイ

## 参考リソース

- [Turso公式ドキュメント](https://docs.turso.tech/)
- [Drizzle ORM公式ドキュメント](https://orm.drizzle.team/)
- [Turso Vector Embeddings Guide](https://docs.turso.tech/features/ai-and-embeddings)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## ライセンス

MIT
