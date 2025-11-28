'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Episode = {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  date: string;
  createdAt: Date | null;
};

export function QuestionForm({ episodes }: { episodes: Episode[] }) {
  const router = useRouter();
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodes.length > 0 ? episodes[0].id : 0
  );
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState<{
    answerText: string;
    sources: Array<{ startTime: number; text: string }>;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !selectedEpisode) return;

    setIsSubmitting(true);
    setAnswer(null);

    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: selectedEpisode,
          userId: 'anonymous', // TODO: 実際のユーザー認証実装時に変更
          questionText: questionText.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('質問の送信に失敗しました');
      }

      const data = await response.json();
      setAnswer(data);
      setQuestionText('');
      router.refresh(); // 質問リストを更新
    } catch (error) {
      console.error('Error submitting question:', error);
      alert('質問の送信に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (episodes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
        <p className="text-center text-[#86868b]">
          質問するには、まず管理者モードで動画を登録してください
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 動画選択 */}
        <div>
          <label htmlFor="episode" className="block text-sm font-medium text-[#1d1d1f] mb-2">
            質問する動画を選択
          </label>
          <select
            id="episode"
            value={selectedEpisode}
            onChange={(e) => setSelectedEpisode(Number(e.target.value))}
            className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
          >
            {episodes.map((episode) => (
              <option key={episode.id} value={episode.id}>
                {episode.title}
              </option>
            ))}
          </select>
        </div>

        {/* 質問入力 */}
        <div>
          <label htmlFor="question" className="block text-sm font-medium text-[#1d1d1f] mb-2">
            質問内容
          </label>
          <textarea
            id="question"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="例: この動画の主要なメッセージは何ですか？"
            rows={4}
            className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all resize-none"
            disabled={isSubmitting}
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={!questionText.trim() || isSubmitting}
          className="w-full px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:text-[#86868b] text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:ring-offset-2"
        >
          {isSubmitting ? '回答を生成中...' : '質問を送信'}
        </button>
      </form>

      {/* 回答表示エリア - Depth原則: モーション付き表示 */}
      {answer && (
        <div className="mt-6 p-6 bg-[#f5f5f7] rounded-xl animate-fade-in">
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-3">AI回答</h3>
          <p className="text-[#1d1d1f] mb-4 leading-relaxed whitespace-pre-wrap">
            {answer.answerText}
          </p>

          {answer.sources && answer.sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#d2d2d7]">
              <h4 className="text-sm font-medium text-[#86868b] mb-2">参照箇所</h4>
              <div className="space-y-2">
                {answer.sources.map((source, idx) => {
                  const minutes = Math.floor(source.startTime / 60);
                  const seconds = Math.floor(source.startTime % 60);
                  const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                  return (
                    <div key={idx} className="text-sm">
                      <span className="font-medium text-[#0066cc]">{timestamp}</span>
                      <span className="text-[#86868b] ml-2">{source.text.substring(0, 100)}...</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
