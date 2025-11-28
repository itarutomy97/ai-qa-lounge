'use client';

import { useState } from 'react';

type QuestionWithAnswer = {
  question: {
    id: number;
    episodeId: number;
    userId: number;
    questionText: string;
    createdAt: Date | null;
  };
  answer: {
    id: number;
    questionId: number;
    answerText: string;
    sources: string | null;
    modelUsed: string;
    createdAt: Date | null;
  } | null;
  episode: {
    id: number;
    youtubeVideoId: string;
    title: string;
    description: string | null;
    date: string;
    createdAt: Date | null;
  } | null;
};

export function QuestionList({ questions }: { questions: QuestionWithAnswer[] }) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(new Set());
  const [isMixing, setIsMixing] = useState(false);

  const toggleSelection = (questionId: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        // 最大2つまで選択可能
        if (newSet.size >= 2) {
          const firstItem = Array.from(newSet)[0];
          newSet.delete(firstItem);
        }
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleMixQuestions = async () => {
    if (selectedQuestions.size !== 2) return;

    setIsMixing(true);
    try {
      const selectedIds = Array.from(selectedQuestions);
      const question1 = questions.find((q) => q.question.id === selectedIds[0]);
      const question2 = questions.find((q) => q.question.id === selectedIds[1]);

      if (!question1 || !question2) return;

      // 2つの質問を組み合わせた新しい質問を作成
      const mixedQuestion = `「${question1.question.questionText}」と「${question2.question.questionText}」の2つの視点を統合すると、どのような洞察が得られますか？`;

      // 質問フォームに自動入力（ページスクロール）
      const questionInput = document.getElementById('question') as HTMLTextAreaElement;
      if (questionInput) {
        questionInput.value = mixedQuestion;
        questionInput.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      setSelectedQuestions(new Set());
    } catch (error) {
      console.error('Error mixing questions:', error);
      alert('質問の統合に失敗しました');
    } finally {
      setIsMixing(false);
    }
  };

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-8">
        <p className="text-center text-[#86868b]">まだ質問がありません</p>
        <p className="text-center text-sm text-[#86868b] mt-2">
          最初の質問を投稿してみましょう！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ミックス機能のボタン */}
      {selectedQuestions.size === 2 && (
        <div className="sticky top-4 z-10 bg-[#0066cc] text-white px-6 py-3 rounded-xl shadow-lg animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-medium">2つの視点を選択しました</span>
            <button
              onClick={handleMixQuestions}
              disabled={isMixing}
              className="px-4 py-2 bg-white text-[#0066cc] rounded-lg font-medium hover:bg-[#f5f5f7] transition-colors disabled:opacity-50"
            >
              {isMixing ? '統合中...' : '質問を統合する'}
            </button>
          </div>
        </div>
      )}

      {/* 質問リスト */}
      <div className="space-y-4">
        {questions.map(({ question, answer, episode }) => (
          <div
            key={question.id}
            className={`bg-white rounded-2xl shadow-sm border transition-all ${
              selectedQuestions.has(question.id)
                ? 'border-[#0066cc] ring-2 ring-[#0066cc] ring-opacity-20'
                : 'border-[#d2d2d7] hover:border-[#86868b]'
            }`}
          >
            <div className="p-6">
              {/* Episode info */}
              {episode && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-white bg-[#0066cc] px-2 py-1 rounded">
                    {episode.title.substring(0, 30)}
                    {episode.title.length > 30 ? '...' : ''}
                  </span>
                </div>
              )}

              {/* Question */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-[#1d1d1f] mb-2">
                  {question.questionText}
                </h3>
                <p className="text-xs text-[#86868b]">
                  {question.createdAt
                    ? new Date(question.createdAt).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>

              {/* Answer */}
              {answer && (
                <div className="mt-4 pt-4 border-t border-[#d2d2d7]">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-[#0066cc] rounded-full flex items-center justify-center text-white text-sm font-medium">
                      AI
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#1d1d1f] leading-relaxed whitespace-pre-wrap">
                        {answer.answerText}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-[#d2d2d7] flex items-center gap-3">
                <button
                  onClick={() => toggleSelection(question.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedQuestions.has(question.id)
                      ? 'bg-[#0066cc] text-white'
                      : 'bg-[#f5f5f7] text-[#1d1d1f] hover:bg-[#e8e8ed]'
                  }`}
                >
                  {selectedQuestions.has(question.id) ? '選択中' : '視点を選択'}
                </button>
                {selectedQuestions.size === 1 && !selectedQuestions.has(question.id) && (
                  <span className="text-xs text-[#86868b]">
                    もう1つ選択して統合質問を作成できます
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
