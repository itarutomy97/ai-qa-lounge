'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompletion } from '@ai-sdk/react';

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
  const [selectedModel, setSelectedModel] = useState('gpt-5-mini');
  const [sources] = useState<Array<{ startTime: number; text: string; similarity?: number }>>([]);

  const { completion, complete, isLoading } = useCompletion({
    api: '/api/questions',
    body: {
      episodeId: selectedEpisode,
      userId: 'anonymous',
      model: selectedModel,
    },
    onFinish: () => {
      setQuestionText('');
      // 少し遅延させてから質問リストを更新
      setTimeout(() => {
        router.refresh();
      }, 1000);
    },
    onError: (error: Error) => {
      console.error('Error:', error);
      alert('質問の送信に失敗しました。もう一度お試しください。');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim() || !selectedEpisode || isLoading) return;

    // 質問を送信してストリーミング開始
    await complete(questionText.trim());
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
            disabled={isLoading}
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
            disabled={isLoading}
          />
        </div>

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={!questionText.trim() || isLoading}
          className="w-full px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:text-[#86868b] text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:ring-offset-2"
        >
          {isLoading ? '回答を生成中...' : '質問を送信'}
        </button>
      </form>

      {/* 回答表示エリア - Depth原則: モーション付き表示 + ストリーミング */}
      {(completion || isLoading) && (
        <div className="mt-6 p-6 bg-[#f5f5f7] rounded-xl animate-fade-in">
          <h3 className="text-lg font-semibold text-[#1d1d1f] mb-3">
            AI回答 {isLoading && <span className="text-sm text-[#86868b]">（生成中...）</span>}
          </h3>
          <p className="text-[#1d1d1f] mb-4 leading-relaxed whitespace-pre-wrap">
            {completion}
            {isLoading && <span className="inline-block w-2 h-4 ml-1 bg-[#0066cc] animate-pulse" />}
          </p>

          {sources && sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#d2d2d7]">
              <h4 className="text-sm font-medium text-[#86868b] mb-2">参照箇所</h4>
              <div className="space-y-2">
                {sources.map((source, idx) => {
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
