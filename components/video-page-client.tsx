'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { StreamingAnswer } from './streaming-answer';
import { QuestionCard } from './question-card';

type Episode = {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string | null;
};

type Question = {
  id: string;
  questionText: string;
  createdAt: string | null;
};

type Answer = {
  answerText: string | null;
  modelUsed: string | null;
  createdAt: string | null;
} | null;

type User = {
  userId: string;
  email: string | null;
} | null;

type QuestionWithAnswer = {
  question: Question;
  answer: Answer;
  user: User;
};

type VideoPageClientProps = {
  episode: Episode;
  episodeId: number;
  myQuestion: Question | null;
  myAnswer: Answer;
  otherQuestions: QuestionWithAnswer[];
  questionId?: string;
  q?: string;
  model?: string;
};

export function VideoPageClient({
  episode,
  episodeId,
  myQuestion,
  myAnswer,
  otherQuestions,
  questionId,
  q,
  model,
}: VideoPageClientProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [showMergeMode, setShowMergeMode] = useState(false);
  const router = useRouter();

  const toggleQuestion = (questionId: string) => {
    const newSet = new Set(selectedQuestions);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setSelectedQuestions(newSet);
  };

  const handleMergeQuestions = () => {
    if (selectedQuestions.size < 2) {
      alert('2つ以上の質問を選択してください');
      return;
    }

    // 選択された質問のテキストを取得
    const selectedTexts = otherQuestions
      .filter((q) => selectedQuestions.has(q.question.id))
      .map((q) => q.question.questionText);

    // 統合質問を生成してリダイレクト
    const mergedPrompt = `以下の複数の質問を統合して、より深い洞察を得られる回答をお願いします:\n\n${selectedTexts.map((text, idx) => `${idx + 1}. ${text}`).join('\n')}`;

    router.push(`/video/${episodeId}?q=${encodeURIComponent(mergedPrompt)}&model=gpt-5-mini`);
  };

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

            {/* 複数質問統合機能の切り替えボタン */}
            {otherQuestions.length >= 2 && (
              <div className="mb-8">
                <button
                  onClick={() => {
                    setShowMergeMode(!showMergeMode);
                    if (showMergeMode) {
                      setSelectedQuestions(new Set());
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl shadow-sm border transition-all text-left flex items-center justify-between ${
                    showMergeMode
                      ? 'bg-white border-[#d2d2d7] hover:shadow-md'
                      : 'bg-[#fffbeb] border-[#fbbf24] hover:bg-[#fef3c7] hover:shadow-md'
                  }`}
                >
                  <span className={`text-sm font-medium ${showMergeMode ? 'text-[#1d1d1f]' : 'text-[#92400e]'}`}>
                    {showMergeMode ? '✕ 統合モードを終了' : '💡 複数の質問を統合して深い洞察を得る'}
                  </span>
                  <span className={`text-xs ${showMergeMode ? 'text-[#86868b]' : 'text-[#b45309]'}`}>
                    {showMergeMode ? `${selectedQuestions.size}個選択中` : `${otherQuestions.length}個の質問から選択`}
                  </span>
                </button>
              </div>
            )}

            {/* 統合モード時の統合ボタン */}
            {showMergeMode && selectedQuestions.size >= 2 && (
              <div className="mb-8">
                <button
                  onClick={handleMergeQuestions}
                  className="w-full px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-xl transition-colors"
                >
                  {selectedQuestions.size}個の質問を統合して回答を生成
                </button>
              </div>
            )}

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
                        <p className="text-[#1d1d1f] font-medium whitespace-pre-wrap">{q}</p>
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
              <h2 className="text-lg font-semibold text-[#1d1d1f] mb-4">
                みんなの質問
                {showMergeMode && (
                  <span className="ml-2 text-xs text-[#0066cc] font-normal">
                    (選択モード)
                  </span>
                )}
              </h2>
              <div className="space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
                {otherQuestions.length > 0 ? (
                  otherQuestions.map(({ question, answer, user }) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      answer={answer}
                      user={user}
                      isSelected={selectedQuestions.has(question.id)}
                      onToggleSelect={toggleQuestion}
                      showCheckbox={showMergeMode}
                    />
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
