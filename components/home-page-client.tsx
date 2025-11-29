'use client';

import Link from 'next/link';
import Image from 'next/image';
import { QuestionForm } from '@/components/question-form';

type Episode = {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  newsletterId: string | null;
  date: string | null;
  captionFetched: boolean | null;
  vectorized: boolean | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type HomePageClientProps = {
  episodes: Episode[];
  userQuestionedEpisodeIds: number[];
};

export function HomePageClient({ episodes, userQuestionedEpisodeIds }: HomePageClientProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header - Deference原則: シンプルで控えめ */}
      <header className="bg-white border-b border-[#d2d2d7]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">GAIS QA Lounge</h1>
          <Link
            href="/admin"
            className="px-4 py-2 text-sm font-medium text-[#0066cc] hover:text-[#0077ed] transition-colors"
          >
            管理者モード
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 説明セクション */}
        <section className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-[#1d1d1f] mb-3">
            動画に質問してみよう
          </h2>
          <p className="text-lg text-[#86868b] mb-2">
            YouTube動画の内容について、AIが詳しく回答します
          </p>
          <p className="text-sm text-[#0066cc] font-medium">
            💡 質問を投稿すると、みんなの質問と回答も見れるようになります
          </p>
        </section>

        {/* 動画一覧 */}
        {episodes.length > 0 && (
          <section className="mb-8">
            <h3 className="text-lg font-semibold text-[#1d1d1f] mb-4">利用可能な動画</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {episodes.map((episode) => {
                const hasQuestioned = userQuestionedEpisodeIds.includes(episode.id);

                return hasQuestioned ? (
                  <div
                    key={episode.id}
                    className="bg-white rounded-xl shadow-sm border border-[#d2d2d7] p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex gap-3 mb-3">
                      <Image
                        src={`https://img.youtube.com/vi/${episode.youtubeVideoId}/mqdefault.jpg`}
                        alt={episode.title}
                        width={128}
                        height={80}
                        className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#1d1d1f] text-sm line-clamp-2 mb-1">
                          {episode.title}
                        </h4>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 text-xs font-medium text-[#0066cc] border border-[#0066cc] hover:bg-[#f5f5f7] rounded-lg transition-colors text-center"
                      >
                        YouTube で視聴
                      </a>
                      <Link
                        href={`/video/${episode.id}`}
                        className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#0066cc] hover:bg-[#0077ed] rounded-lg transition-colors text-center"
                      >
                        みんなの質問を見る
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div
                    key={episode.id}
                    className="bg-white rounded-xl shadow-sm border border-[#d2d2d7] p-4"
                  >
                    <div className="flex gap-3 mb-3">
                      <Image
                        src={`https://img.youtube.com/vi/${episode.youtubeVideoId}/mqdefault.jpg`}
                        alt={episode.title}
                        width={128}
                        height={80}
                        className="w-32 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[#1d1d1f] text-sm line-clamp-2 mb-1">
                          {episode.title}
                        </h4>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`https://www.youtube.com/watch?v=${episode.youtubeVideoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 text-xs font-medium text-[#0066cc] border border-[#0066cc] hover:bg-[#f5f5f7] rounded-lg transition-colors text-center"
                      >
                        YouTube で視聴
                      </a>
                      <div className="flex-1 px-3 py-2 text-xs font-medium text-[#86868b] bg-[#f5f5f7] rounded-lg text-center cursor-not-allowed opacity-60">
                        🔒 質問すると解除
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 質問入力フォーム */}
        <section>
          <QuestionForm episodes={episodes} />
        </section>



        {episodes.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-[#d2d2d7]">
            <p className="text-[#86868b] mb-4">まだ動画が登録されていません</p>
            <Link
              href="/admin"
              className="inline-block px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-xl transition-colors"
            >
              管理者モードで動画を登録
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
