import { db } from '@/db';
import { episodes, questions, answers } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { QuestionForm } from '@/components/question-form';
import { QuestionList } from '@/components/question-list';

export default async function Page() {
  // エピソード一覧を取得
  const allEpisodes = await db.select().from(episodes).orderBy(desc(episodes.createdAt));

  // 全ての質問と回答を取得（最新順）
  const allQuestions = await db
    .select({
      question: questions,
      answer: answers,
      episode: episodes,
    })
    .from(questions)
    .leftJoin(answers, eq(answers.questionId, questions.id))
    .leftJoin(episodes, eq(episodes.id, questions.episodeId))
    .orderBy(desc(questions.createdAt))
    .limit(50);

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header - Deference原則: シンプルで控えめ */}
      <header className="bg-white border-b border-[#d2d2d7]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">AI QA Lounge</h1>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-[#0066cc] hover:text-[#0077ed] transition-colors"
          >
            管理者モード
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* YouTube動画選択セクション - Clarity原則: 明確な階層 */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">対象動画</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
            {allEpisodes.length > 0 ? (
              <div className="space-y-4">
                {allEpisodes.map((episode) => (
                  <div
                    key={episode.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-[#f5f5f7] hover:bg-[#e8e8ed] transition-colors"
                  >
                    {/* YouTube thumbnail */}
                    <div className="flex-shrink-0">
                      <img
                        src={`https://img.youtube.com/vi/${episode.youtubeVideoId}/mqdefault.jpg`}
                        alt={episode.title}
                        className="w-40 h-24 object-cover rounded-lg"
                      />
                    </div>
                    {/* Episode info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1d1d1f] mb-1 line-clamp-2">
                        {episode.title}
                      </h3>
                      {episode.description && (
                        <p className="text-sm text-[#86868b] line-clamp-2">
                          {episode.description}
                        </p>
                      )}
                      <a
                        href={`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-[#0066cc] hover:text-[#0077ed]"
                      >
                        YouTube で視聴 →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[#86868b]">登録されている動画がありません</p>
                <Link
                  href="/admin"
                  className="inline-block mt-4 text-sm text-[#0066cc] hover:text-[#0077ed]"
                >
                  管理者モードで動画を登録 →
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 質問入力フォーム */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">質問する</h2>
          <QuestionForm episodes={allEpisodes} />
        </section>

        {/* 他のユーザーの回答 */}
        <section>
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">みんなの質問と回答</h2>
          <QuestionList questions={allQuestions} />
        </section>
      </main>
    </div>
  );
}
