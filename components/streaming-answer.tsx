'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store/user-store';

type StreamingAnswerProps = {
  questionId?: string;
  episodeId: number;
  questionText?: string;
  model?: string;
  initialAnswer?: {
    answerText: string;
    modelUsed: string | null;
    createdAt: string | null;
  } | null;
};

export function StreamingAnswer({
  questionId,
  episodeId,
  questionText,
  model = 'gpt-5-mini',
  initialAnswer
}: StreamingAnswerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { visitorId } = useUserStore();
  const [streamedText, setStreamedText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasStartedStreaming = useRef(false);
  const prevQuestionText = useRef<string | undefined>(undefined);

  // questionTextが変わったら状態をリセット（バグ2対策）
  useEffect(() => {
    if (prevQuestionText.current !== undefined && prevQuestionText.current !== questionText) {
      console.log('[StreamingAnswer] questionText changed, resetting state');
      hasStartedStreaming.current = false;
      setStreamedText('');
      setError(null);
    }
    prevQuestionText.current = questionText;
  }, [questionText]);

  // ストリーミング処理
  const startStreaming = useCallback(async (prompt: string) => {
    if (hasStartedStreaming.current) {
      console.log('[StreamingAnswer] Already started streaming, skipping...');
      return;
    }

    // visitorIdがない場合は待つ
    if (!visitorId) {
      console.log('[StreamingAnswer] No visitorId, waiting...');
      return;
    }

    hasStartedStreaming.current = true;

    try {
      setIsStreaming(true);
      setError(null);
      setStreamedText('');

      console.log('[StreamingAnswer] Starting streaming for:', prompt);

      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodeId,
          visitorId,
          prompt,
          model,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      // レスポンスヘッダーから質問IDを取得
      const newQuestionId = response.headers.get('X-Question-Id');
      if (newQuestionId) {
        console.log('[StreamingAnswer] Question ID:', newQuestionId);

        // URLを書き換え
        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        params.delete('model');
        params.set('questionId', newQuestionId);

        const newUrl = `/video/${episodeId}?${params.toString()}`;
        window.history.replaceState(window.history.state, '', newUrl);
      }

      // ストリーミング読み取り
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[StreamingAnswer] Streaming complete');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        setStreamedText(accumulatedText);
      }

      setIsStreaming(false);

      // ストリーミング完了後、サーバーコンポーネントを再フェッチして「みんなの質問」を更新（バグ1対策）
      router.refresh();
    } catch (err) {
      console.error('[StreamingAnswer] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsStreaming(false);
      hasStartedStreaming.current = false; // エラー時はリトライ可能にする
    }
  }, [episodeId, model, searchParams, visitorId, router]);

  // URLパラメータから質問が渡された場合、自動的にストリーミング開始
  useEffect(() => {
    // questionId が既にある場合は再生成せずにDBの回答を使う
    if (questionId) {
      console.log('[StreamingAnswer] questionId already exists, skipping streaming');
      return;
    }

    // visitorIdがない場合は待つ
    if (!visitorId) {
      console.log('[StreamingAnswer] Waiting for visitorId...');
      return;
    }

    // 質問テキストがあり、まだストリーミングを開始していない場合
    if (questionText && !hasStartedStreaming.current) {
      console.log('[StreamingAnswer] Starting streaming automatically for:', questionText);
      startStreaming(questionText);
    }
  }, [questionText, questionId, startStreaming, visitorId]);

  // ストリーミング中または完了後の表示
  if (questionText && (isStreaming || streamedText)) {
    const displayText = streamedText || '回答を生成中...';

    return (
      <div className="pt-6 border-t border-[#d2d2d7]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#34c759] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">A</span>
          </div>
          <div className="flex-1">
            <p className="text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
              {displayText}
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-[#0066cc] animate-pulse" />
              )}
            </p>
            {isStreaming && (
              <div className="mt-3">
                <span className="text-xs px-2 py-1 bg-[#f5f5f7] text-[#86868b] rounded animate-pulse">
                  生成中...
                </span>
              </div>
            )}
            {error && (
              <div className="mt-3">
                <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded">
                  エラーが発生しました: {error}
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
