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
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password
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

## 実装済み機能

### 1. YouTube動画管理

- **動画URL自動解析**: YouTube URLを入力するだけで自動的にビデオIDを抽出
- **メタデータ自動取得**: `youtubei.js`でタイトル・説明を自動取得
- **字幕取得**: YouTube字幕を自動取得（日本語・英語対応）
- **ベクトル化**: OpenAI `text-embedding-3-small`で1536次元ベクトルに変換

### 2. AIストリーミング回答生成

- **リアルタイムストリーミング**: Vercel AI SDKの`useCompletion`で回答をリアルタイム表示
- **複数モデル対応**:
  - GPT-5シリーズ（GPT-5, GPT-5-mini, GPT-5-nano）
  - 推論特化モデル（o3）
  - GPT-4シリーズ（GPT-4o, GPT-4o-mini, GPT-4 Turbo）
  - レガシー（GPT-3.5 Turbo）
- **コンテキスト付き回答**: RAG検索結果に基づいた正確な回答
- **タイムスタンプ参照**: 回答内に動画のタイムスタンプを含める

### 3. RAGベクトル検索

- **コサイン類似度検索**: Turso libSQLの`vector_distance_cos`関数を使用
- **トップK検索**: 質問に最も関連する上位5件の字幕セグメントを取得
- **F32_BLOBベクトル**: 1536次元のFloat32配列をネイティブサポート

### 4. Apple HIG準拠UI

- **Clarity（明快さ）**: シンプルで分かりやすいインターフェース
- **Deference（控えめさ）**: コンテンツを邪魔しないデザイン
- **Depth（奥行き）**: モーションとレイヤーによる階層表現
- **レスポンシブ**: モバイル・デスクトップ両対応

### 5. 管理画面

- **シンプル認証**: パスワードベースのアクセス制御
- **動画登録**: YouTube URLから簡単に動画を登録
- **エピソード管理**: 登録済み動画の一覧表示

## データベース管理

Drizzle ORMを使用したデータベース操作：

- `npm run db:generate` - スキーマ変更からマイグレーションファイルを生成
- `npm run db:push` - スキーマ変更を直接DBにプッシュ（開発用）
- `npm run db:migrate` - マイグレーションを実行
- `npm run db:studio` - Drizzle Studioを開いてDBを管理

### Drizzle Studioの使用方法

```bash
npm run db:studio
```

ブラウザで `https://local.drizzle.studio` が開き、以下を確認できます:
- episodes（動画情報）
- users（ユーザー）
- user_profiles（プロファイル）
- video_captions（字幕 + ベクトル埋め込み）
- questions（質問）
- answers（回答 + 使用モデル情報）

## 技術的なハイライト

### シングルDBアーキテクチャ

従来のRAGシステムでは、リレーショナルDB（PostgreSQL）とベクトルDB（Pinecone/Weaviate）の2つが必要でしたが、本プロジェクトでは**Turso libSQL単体**で完結:

```typescript
// カスタムF32_BLOB型定義
const float32Array = customType<{
  data: number[];
  config: { dimensions: number };
  configRequired: true;
  driverData: Buffer;
}>({
  dataType(config) {
    return `F32_BLOB(${config.dimensions})`;
  },
  fromDriver(value: Buffer) {
    return Array.from(new Float32Array(value.buffer));
  },
  toDriver(value: number[]) {
    return sql`vector32(${JSON.stringify(value)})`;
  },
});
```

### ストリーミングアーキテクチャ

```
User Input → useCompletion (Client)
              ↓
         POST /api/questions
              ↓
         RAG Search (Turso vector_distance_cos)
              ↓
         streamText (Server)
              ↓
         toTextStreamResponse
              ↓
    Real-time Streaming to Client
```

### ベクトル検索クエリ

```typescript
const searchResults = await db
  .select({
    id: videoCaptions.id,
    startTime: videoCaptions.startTime,
    text: videoCaptions.text,
    similarity: sql<number>`1 - vector_distance_cos(${videoCaptions.embedding}, vector32(${JSON.stringify(queryEmbedding)}))`,
  })
  .from(videoCaptions)
  .where(eq(videoCaptions.episodeId, episodeId))
  .orderBy(desc(sql`1 - vector_distance_cos(...)`))
  .limit(topK);
```

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
- [x] ベクトル対応スキーマ定義（F32_BLOB(1536)）
- [x] AI/RAGパッケージインストール
- [x] データベーステーブル作成
- [x] Vitestテスト環境構築

### Phase 2: YouTube RAGパイプライン ✅ 完了

- [x] YouTube字幕取得機能（youtubei.js）
- [x] ベクトル化パイプライン（OpenAI text-embedding-3-small）
- [x] 管理画面API（エピソード登録）
- [x] YouTube URL自動パース & 動画情報取得

### Phase 3: ユーザーQ&A機能 ✅ 完了

- [x] RAG検索機能（コサイン類似度ベクトル検索）
- [x] ストリーミング回答生成機能（Vercel AI SDK）
- [x] Q&A UI実装（Apple HIG準拠）
- [x] リアルタイムストリーミング表示
- [x] AIモデル選択機能（GPT-5/GPT-4/o3対応）
- [x] 匿名ユーザー自動作成

### Phase 4: 管理画面 & UI改善 ✅ 完了

- [x] 管理画面UI（パスワード認証）
- [x] 動画登録フォーム
- [x] エピソード一覧表示
- [x] トップページUI（動画選択・質問フォーム・回答一覧）
- [x] Drizzle Studio対応（リレーション定義修正）

### 次のステップ（将来の拡張）

- [ ] パーソナライズURL生成（メール配信用）
- [ ] 本番デプロイ（Vercel + Turso Cloud）
- [ ] ユーザー認証強化（OAuth/メールリンク）
- [ ] 質問いいね機能
- [ ] 2-view混合機能（複数回答の組み合わせ）

## 参考リソース

- [Turso公式ドキュメント](https://docs.turso.tech/)
- [Drizzle ORM公式ドキュメント](https://orm.drizzle.team/)
- [Turso Vector Embeddings Guide](https://docs.turso.tech/features/ai-and-embeddings)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## ライセンス

MIT
