'use client';

import { useQAStore } from '@/lib/store/qa-store';
import { useEffect } from 'react';

type StreamingAnswerProps = {
  questionId: string;
  initialAnswer?: {
    answerText: string;
    modelUsed: string | null;
    createdAt: string | null;
  } | null;
};

export function StreamingAnswer({ questionId, initialAnswer }: StreamingAnswerProps) {
  const { currentQuestion, clearQuestion } = useQAStore();

  // コンポーネントがアンマウントされたらストアをクリア
  useEffect(() => {
    return () => {
      // ストリーミングが完了している場合のみクリア
      if (currentQuestion && !currentQuestion.isLoading) {
        clearQuestion();
      }
    };
  }, [currentQuestion, clearQuestion]);

  // Zustandストアに質問がある場合はストリーミング表示
  if (currentQuestion && currentQuestion.questionId === questionId) {
    return (
      <div className="pt-6 border-t border-[#d2d2d7]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#34c759] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div className="flex-1">
            <p className="text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
              {currentQuestion.completion || '回答を生成中...'}
              {currentQuestion.isLoading && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#0066cc] animate-pulse" />
              )}
            </p>
            {currentQuestion.isLoading && (
              <div className="mt-3">
                <span className="text-xs px-2 py-1 bg-[#f5f5f7] text-[#86868b] rounded animate-pulse">
                  生成中...
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DBから取得した回答を表示
  if (initialAnswer) {
    return (
      <div className="pt-6 border-t border-[#d2d2d7]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#34c759] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div className="flex-1">
            <p className="text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
              {initialAnswer.answerText}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-[#f5f5f7] text-[#86868b] rounded">
                {initialAnswer.modelUsed || 'AI'}
              </span>
              <span className="text-xs text-[#86868b]">
                {initialAnswer.createdAt
                  ? new Date(initialAnswer.createdAt).toLocaleString('ja-JP')
                  : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 回答待ち
  return (
    <div className="pt-6 border-t border-[#d2d2d7] text-center">
      <p className="text-[#86868b]">回答を生成中...</p>
    </div>
  );
}
