export default async function Page() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900">
          AI QA Lounge
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          GAISメルマガ購読者向けの動画コンテンツ質問コミュニティプラットフォーム
        </p>
        <div className="pt-4 space-y-2">
          <div className="text-sm text-gray-500">
            Phase 1: プロジェクトセットアップ完了 ✓
          </div>
          <div className="text-sm text-gray-400">
            Next.js 15 + Turso + Drizzle ORM + Vercel AI SDK
          </div>
        </div>
      </div>
    </div>
  );
}
