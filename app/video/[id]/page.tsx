import { db } from '@/db';
import { episodes, questions, answers, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { StreamingAnswer } from '@/components/streaming-answer';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ questionId?: string; q?: string; model?: string }>;
};

export default async function VideoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { questionId, q, model } = await searchParams;
  const episodeId = parseInt(id, 10);

  if (isNaN(episodeId)) {
    notFound();
  }

  // エピソード情報を取得
  const [episode] = await db
    .select()
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .limit(1);

  if (!episode) {
    notFound();
  }

  // 自分の質問と回答を取得（questionIdが指定されている場合）
  let myQuestion = null;
  let myAnswer = null;

  if (questionId) {
    const [questionData] = await db
      .select({
        question: questions,
        answer: answers,
      })
      .from(questions)
      .leftJoin(answers, eq(answers.questionId, questions.id))
      .where(eq(questions.id, questionId))
      .limit(1);

    if (questionData) {
      myQuestion = questionData.question;
      myAnswer = questionData.answer;
    }
  }

  // みんなの質問と回答を取得（最新10件、自分の質問は除外）
  const allQuestions = await db
    .select({
      question: questions,
      answer: answers,
      user: users,
    })
    .from(questions)
    .leftJoin(answers, eq(answers.questionId, questions.id))
    .leftJoin(users, eq(users.id, questions.userId))
    .where(eq(questions.episodeId, episodeId))
    .orderBy(desc(questions.createdAt))
    .limit(10);

  // 自分の質問を除外
  const otherQuestions = questionId
    ? allQuestions.filter((q) => q.question.id !== questionId)
    : allQuestions;

  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#d2d2d7]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-semibold text-[#1d1d1f] hover:text-[#0066cc] transition-colors">
            GAIS QA Lounge
          </Link>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-[#0066cc] hover:text-[#0077ed] transition-colors"
          >
            管理者モード
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* 左側: 動画情報 + 自分の質問・回答 */}
          <div className="flex-1">
            {/* 動画情報 */}
            <section className="mb-8">
              <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
                <div className="flex gap-4 mb-4">
                  <Image
                    src={`https://img.youtube.com/vi/${episode.youtubeVideoId}/mqdefault.jpg`}
                    alt={episode.title}
                    width={192}
                    height={128}
                    className="w-48 h-32 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1">
                    <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-2">
                      {episode.title}
                    </h1>
                    {episode.description && (
                      <p className="text-sm text-[#86868b] line-clamp-3 mb-3">
                        {episode.description}
                      </p>
                    )}
                    <a
                      href={`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-[#0066cc] hover:bg-[#0077ed] text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      YouTube で視聴 →
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* 自分の質問と回答 */}
            {myQuestion && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">あなたの質問</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
                  {/* 質問 */}
                  <div className="mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">Q</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1d1d1f] font-medium">{myQuestion.questionText}</p>
                        <p className="text-xs text-[#86868b] mt-1">
                          {new Date(myQuestion.createdAt || '').toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 回答 - ストリーミング対応 */}
                  <StreamingAnswer
                    questionId={questionId!}
                    episodeId={episodeId}
                    initialAnswer={
                      myAnswer
                        ? {
                            answerText: myAnswer.answerText || '',
                            modelUsed: myAnswer.modelUsed,
                            createdAt: myAnswer.createdAt,
                          }
                        : null
                    }
                  />
                </div>

                {/* トップに戻るボタン */}
                <div className="mt-6 text-center">
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-xl transition-colors"
                  >
                    他の動画に質問する
                  </Link>
                </div>
              </section>
            )}

            {!myQuestion && !q && (
              <div className="text-center py-12">
                <p className="text-[#86868b] mb-4">質問を投稿して、みんなの回答を見てみましょう</p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-xl transition-colors"
                >
                  質問する
                </Link>
              </div>
            )}

            {/* URLパラメータから質問が渡された場合 */}
            {!myQuestion && q && (
              <section className="mb-8">
                <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">あなたの質問</h2>
                <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
                  {/* 質問 */}
                  <div className="mb-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-medium">Q</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-[#1d1d1f] font-medium">{q}</p>
                      </div>
                    </div>
                  </div>

                  {/* 回答 - ストリーミング対応 */}
                  <StreamingAnswer
                    episodeId={episodeId}
                    questionText={q}
                    model={model}
                  />
                </div>

                {/* トップに戻るボタン */}
                <div className="mt-6 text-center">
                  <Link
                    href="/"
                    className="inline-block px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-xl transition-colors"
                  >
                    他の動画に質問する
                  </Link>
                </div>
              </section>
            )}
          </div>

          {/* 右サイドバー: みんなの質問 */}
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-4">
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">みんなの質問</h2>
              <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {otherQuestions.length > 0 ? (
                  otherQuestions.map(({ question, answer }) => (
                    <div
                      key={question.id}
                      className="bg-white rounded-xl shadow-sm border border-[#d2d2d7] p-4 hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm text-[#1d1d1f] font-medium mb-2 line-clamp-2">
                        {question.questionText}
                      </p>
                      {answer && (
                        <p className="text-xs text-[#86868b] line-clamp-3 mb-2">
                          {answer.answerText}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#86868b]">
                          {new Date(question.createdAt || '').toLocaleDateString('ja-JP')}
                        </span>
                        {answer && (
                          <span className="text-xs px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded">
                            {answer.modelUsed}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl border border-[#d2d2d7] p-6 text-center">
                    <p className="text-sm text-[#86868b]">まだ他の質問はありません</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
