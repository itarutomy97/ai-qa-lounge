# GAIS QA Lounge

**動画を見るだけじゃ、もったいない。**

GAISメルマガ購読者向けの動画コンテンツ質問コミュニティプラットフォーム

## プロジェクト概要

### コンセプト

GAISメルマガで配信される勉強会動画を「見るだけ」から「学び合う」体験に変革する教育コミュニティWebアプリです。

**課題:**
- 動画を見ても疑問が残るが、質問する場がない
- 他の参加者がどんな気づきを得たのか分からない
- コンテンツが一方通行で終わり、知識が個人に閉じている

**解決策:**
メルマガのURLをクリックするだけで、その回の動画に紐づいたQ&Aコミュニティに参加。質問するとRAGで動画内容から即座に回答が得られ、他の人の質問と回答も見られるようになります。

### ユーザー体験フロー

```
1. メルマガを受信
   └─ 「第20回 GenAI 勉強会」のダイジェスト + 動画URL

2. 動画を視聴して疑問が生まれる
   └─ 「IOWNって具体的にどう使えるの？」

3. メルマガ内のQ&Aリンクをクリック
   └─ パーソナライズURLで自動認証、すぐにQ&Aルームへ

4. 質問を投稿
   └─ AIが動画字幕をRAG検索し、タイムスタンプ付きで即回答

5. 他の人の質問も閲覧可能に（1問質問でロック解除）
   └─ 「あ、この視点は考えなかった！」と新たな学び

6. 複数の質問を選んで統合回答を生成
   └─ 関連する質問をまとめて、より深い洞察を得る
```

### 主な機能

- **メルマガ連動Q&A**: 各回の動画に紐づいた専用Q&Aルーム
- **RAG回答生成**: 動画字幕から関連箇所を検索し、タイムスタンプ付きで回答
- **コミュニティ機能**: 1問質問すると他の人のQ&Aが見られるロック解除仕様
- **複数質問の統合**: 関連する質問を選んでまとめた回答を生成
- **エピソード管理**: YouTube動画登録・字幕取得・ベクトル化（管理者向け）

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

`.env.example` をコピーして `.env.local` を作成：

```bash
cp .env.example .env.local
```

`.env.local` を編集して、OpenAI APIキーを設定：

```bash
# Turso Database (ローカル開発用 - ファイルベースDB)
TURSO_DATABASE_URL=file:local.db
# 本番環境ではTurso Cloudの認証トークンが必要
# TURSO_AUTH_TOKEN=

# OpenAI（必須）
OPENAI_API_KEY=your_openai_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Admin認証
ADMIN_PASSWORD=your_secure_admin_password
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password
```

### 3. データベースのセットアップ

```bash
# スキーマを直接DBにプッシュ（開発時推奨）
npm run db:push
```

> **Note**: ローカル開発では `file:local.db` でSQLiteファイルが作成されます。Turso Cloudは不要です。

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
- [x] 複数質問の統合回答: 関連する複数の質問をまとめて深い洞察を得る

### Phase 4: 管理画面 & UI改善 ✅ 完了

- [x] 管理画面UI（パスワード認証）
- [x] 動画登録フォーム
- [x] エピソード一覧表示
- [x] トップページUI（動画選択・質問フォーム・回答一覧）
- [x] Drizzle Studio対応（リレーション定義修正）

---

## 今後のロードマップ

### Phase 5: 本番デプロイ・運用準備

- [ ] **本番デプロイ**: Vercel + Turso Cloud
- [ ] **パーソナライズURL生成**: メール配信用の個別URLを自動生成
- [ ] **メール配信リスト管理**: CSV一括アップロード・URL出力機能

### Phase 6: 認証・セキュリティ強化

現在はニックネーム + localStorage による簡易ユーザー識別を採用していますが、本番運用では以下の強化を検討:

#### 認証オプション
- **Auth.js (NextAuth.js) + Google OAuth**: GAISメルマガ購読者のGoogleアカウントでログイン
- **メールマジックリンク認証**: パスワード不要、メールで認証リンクを送信
- **パーソナライズURL認証**: メルマガからのワンクリックアクセス（現在のuser_idベースを拡張）

#### 実装優先度
1. Google OAuth（最も簡単、エンタープライズ利用に適合）
2. メールマジックリンク（パスワード管理不要）
3. Apple Sign In（iOS ユーザー向け）

### Phase 7: コミュニティ機能強化

- [ ] **質問いいね機能**: 良い質問に投票、人気質問ランキング
- [ ] **ユーザープロファイル**: 所属組織・職種に応じた回答パーソナライズ
- [ ] **回答評価**: 役に立った/立たなかったのフィードバック

### Phase 8: パーソナライズ機能

> 「自分の文脈」を差し込める: 同じ動画でも、ユーザーの現場に引き寄せた回答を生成

- プロファイル項目:
  - 所属組織タイプ（自治体、中小製造業、大企業、学校、個人事業主など）
  - 職種（総務、経営者、教員、エンジニア、マーケターなど）
  - 関心領域（業務効率化、DX推進、教育活用など）

### Phase 9: フィードバックループ

- [ ] **よくある質問TOP10自動生成**: 質問の類似度クラスタリング
- [ ] **次回勉強会テーマ提案**: 質問傾向から講師へフィードバック
- [ ] **GAIS公式サイトへのFAQ自動公開**: API連携

### Phase 10: マルチチャネル展開

- [ ] **Slackボット**: `/ai-qa episode:20` でQ&Aルームへのリンク生成
- [ ] **Microsoft Teams連携**: Adaptive Cardsで質問投稿UI提供
- [ ] **LINE WORKS連携**: GAIS会員企業のグループに通知

### Phase 11: AI駆動の学習支援

- [ ] **学習パス提案**: ユーザーの質問履歴から興味領域を分析
- [ ] **関連エピソード推薦**: 「あなたにオススメの過去エピソード」
- [ ] **学習進捗ダッシュボード**: 視聴・質問・コミュニティ貢献度

## 参考リソース

- [Turso公式ドキュメント](https://docs.turso.tech/)
- [Drizzle ORM公式ドキュメント](https://orm.drizzle.team/)
- [Turso Vector Embeddings Guide](https://docs.turso.tech/features/ai-and-embeddings)
- [Vercel AI SDK](https://sdk.vercel.ai/)

## ライセンス・著作権

本プロジェクトは **GAIS AI DEVCON 2026** への応募作品です。

- **著作権**: 制作者本人に帰属
- **利用権**: GAISに対して無期限・無償・非独占的利用権を付与
- GAISが運用・保守のため改修する場合があります

詳細は [GAIS AI DEVCON 2026 募集要項](https://gais.jp/ai-devcon-2026/) を参照してください。
