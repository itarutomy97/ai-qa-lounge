'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Question = {
  id: string;
  questionText: string;
  createdAt: string | null;
};

type Answer = {
  answerText: string | null;
  modelUsed: string | null;
} | null;

type QuestionWithAnswer = {
  question: Question;
  answer: Answer;
};

type QuestionMergerProps = {
  questions: QuestionWithAnswer[];
  episodeId: number;
};

export function QuestionMerger({ questions, episodeId }: QuestionMergerProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleMergeQuestions = async () => {
    if (selectedQuestions.size < 2) {
      alert('2つ以上の質問を選択してください');
      return;
    }

    setIsGenerating(true);

    try {
      // 選択された質問のテキストを取得
      const selectedTexts = questions
        .filter((q) => selectedQuestions.has(q.question.id))
        .map((q) => q.question.questionText);

      // 統合質問を生成してリダイレクト
      const mergedPrompt = `以下の複数の質問を統合して、より深い洞察を得られる回答をお願いします:\n\n${selectedTexts.map((text, idx) => `${idx + 1}. ${text}`).join('\n')}`;

      // URLパラメータとして統合質問を渡す
      router.push(`/video/${episodeId}?q=${encodeURIComponent(mergedPrompt)}&model=gpt-5-mini`);
    } catch (error) {
      console.error('Error merging questions:', error);
      alert('エラーが発生しました');
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6 mb-8">
      <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">
        💡 複数の質問を統合して、より深い洞察を得る
      </h3>
      <p className="text-sm text-[#86868b] mb-4">
        2つ以上の質問を選択して、統合的な回答を生成できます
      </p>

      <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
        {questions.map(({ question }) => (
          <label
            key={question.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-[#d2d2d7] hover:bg-[#f5f5f7] cursor-pointer transition-colors"
          >
            <input
              type="checkbox"
              checked={selectedQuestions.has(question.id)}
              onChange={() => toggleQuestion(question.id)}
              className="mt-1 w-4 h-4 text-[#0066cc] rounded border-[#d2d2d7] focus:ring-[#0066cc]"
            />
            <div className="flex-1">
              <p className="text-sm text-[#1d1d1f] font-medium">{question.questionText}</p>
              <p className="text-xs text-[#86868b] mt-1">
                {new Date(question.createdAt || '').toLocaleDateString('ja-JP')}
              </p>
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-[#86868b]">
          {selectedQuestions.size > 0 ? (
            <span className="font-medium text-[#0066cc]">
              {selectedQuestions.size}個の質問を選択中
            </span>
          ) : (
            <span>質問を2つ以上選択してください</span>
          )}
        </div>

        <button
          onClick={handleMergeQuestions}
          disabled={selectedQuestions.size < 2 || isGenerating}
          className="px-6 py-2 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? '生成中...' : '統合回答を生成'}
        </button>
      </div>
    </div>
  );
}
