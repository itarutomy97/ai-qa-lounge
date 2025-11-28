'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQAStore } from '@/lib/store/qa-store';

type Episode = {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  date: string | null;
  createdAt: string | null;
};

export function QuestionForm({ episodes }: { episodes: Episode[] }) {
  const router = useRouter();
  const [selectedEpisode, setSelectedEpisode] = useState<number>(
    episodes.length > 0 ? episodes[0].id : 0
  );
  const [questionText, setQuestionText] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setCurrentQuestion } = useQAStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !selectedEpisode || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // まず質問を登録してIDを取得
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          episodeId: selectedEpisode,
          userId: 'anonymous',
          questionText: questionText.trim(),
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit question');
      }

      const questionId = response.headers.get('X-Question-Id');
      if (questionId) {
        // Zustandストアに質問情報を保存
        setCurrentQuestion({
          questionId,
          episodeId: selectedEpisode,
          questionText: questionText.trim(),
        });
        // 即座にビデオページへ遷移
        router.push(`/video/${selectedEpisode}?questionId=${questionId}`);
      }
    } catch (error) {
      console.error('Error:', error);
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

        {/* AIモデル選択 */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-[#1d1d1f] mb-2">
            AIモデル
          </label>
          <select
            id="model"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
            disabled={isSubmitting}
          >
            <optgroup label="GPT-5シリーズ（最新）">
              <option value="gpt-5">GPT-5（最高性能・コーディング特化）</option>
              <option value="gpt-5-mini">GPT-5 mini（高速・推奨）</option>
              <option value="gpt-5-nano">GPT-5 nano（超高速・低コスト）</option>
            </optgroup>
            <optgroup label="推論特化モデル">
              <option value="o3">o3（推論・数学・科学特化）</option>
            </optgroup>
            <optgroup label="GPT-4シリーズ">
              <option value="gpt-4o">GPT-4o（バランス型）</option>
              <option value="gpt-4o-mini">GPT-4o mini（高速）</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
            </optgroup>
            <optgroup label="レガシー">
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo（最安）</option>
            </optgroup>
          </select>
          <p className="mt-1 text-xs text-[#86868b]">
            GPT-5は最新モデル。コーディング・複雑な推論に最適
          </p>
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
          {isSubmitting ? '質問を送信中...' : '質問を送信'}
        </button>
      </form>
    </div>
  );
}
