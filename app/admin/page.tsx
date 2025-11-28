'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Episode = {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  date: string;
  createdAt: Date | null;
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // 認証チェック
  useEffect(() => {
    const auth = sessionStorage.getItem('admin_authenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
      fetchEpisodes();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // 簡易的なパスワード認証（本番環境では適切な認証を実装すること）
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('admin_authenticated', 'true');
      fetchEpisodes();
    } else {
      alert('パスワードが正しくありません');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('admin_authenticated');
    setPassword('');
  };

  const fetchEpisodes = async () => {
    try {
      const response = await fetch('/api/admin/episodes');
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data.episodes || []);
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVideoUrl.trim()) return;

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const response = await fetch('/api/admin/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: newVideoUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '動画の登録に失敗しました');
      }

      setStatusMessage(`✅ 動画を登録しました: ${data.episode.title}`);
      setNewVideoUrl('');
      await fetchEpisodes();
    } catch (error: any) {
      setStatusMessage(`❌ エラー: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ログイン画面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-semibold text-[#1d1d1f] mb-2">管理者モード</h1>
              <p className="text-sm text-[#86868b]">AI QA Lounge</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
                  placeholder="パスワードを入力"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:ring-offset-2"
              >
                ログイン
              </button>

              <Link
                href="/"
                className="block text-center text-sm text-[#0066cc] hover:text-[#0077ed] transition-colors"
              >
                ← トップページに戻る
              </Link>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // 管理画面
  return (
    <div className="min-h-screen bg-[#f5f5f7]">
      {/* Header */}
      <header className="bg-white border-b border-[#d2d2d7]">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-[#1d1d1f]">管理者モード</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-[#0066cc] hover:text-[#0077ed] transition-colors"
            >
              トップページ
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-[#86868b] hover:text-[#1d1d1f] transition-colors"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* 動画登録フォーム */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">YouTube動画を登録</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6">
            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label htmlFor="videoUrl" className="block text-sm font-medium text-[#1d1d1f] mb-2">
                  YouTube動画URL
                </label>
                <input
                  type="text"
                  id="videoUrl"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-xs text-[#86868b]">
                  動画URLを入力すると、字幕を自動取得してベクトル化します（数分かかる場合があります）
                </p>
              </div>

              <button
                type="submit"
                disabled={!newVideoUrl.trim() || isSubmitting}
                className="w-full px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] disabled:bg-[#d2d2d7] disabled:text-[#86868b] text-white font-medium rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:ring-offset-2"
              >
                {isSubmitting ? '登録中...' : '動画を登録'}
              </button>

              {statusMessage && (
                <div
                  className={`p-4 rounded-xl text-sm ${
                    statusMessage.startsWith('✅')
                      ? 'bg-green-50 text-green-800 border border-green-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {statusMessage}
                </div>
              )}
            </form>
          </div>
        </section>

        {/* 登録済み動画一覧 */}
        <section>
          <h2 className="text-xl font-semibold text-[#1d1d1f] mb-4">
            登録済み動画 ({episodes.length}件)
          </h2>
          {episodes.length > 0 ? (
            <div className="space-y-4">
              {episodes.map((episode) => (
                <div
                  key={episode.id}
                  className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={`https://img.youtube.com/vi/${episode.youtubeVideoId}/mqdefault.jpg`}
                      alt={episode.title}
                      className="w-40 h-24 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[#1d1d1f] mb-1">{episode.title}</h3>
                      {episode.description && (
                        <p className="text-sm text-[#86868b] mb-2 line-clamp-2">
                          {episode.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-[#86868b]">
                        <span>ID: {episode.youtubeVideoId}</span>
                        <span>
                          {episode.createdAt
                            ? new Date(episode.createdAt).toLocaleDateString('ja-JP')
                            : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-[#d2d2d7] p-8">
              <p className="text-center text-[#86868b]">まだ動画が登録されていません</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
