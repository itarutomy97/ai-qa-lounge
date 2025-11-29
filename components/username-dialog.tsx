'use client';

import { useState, useEffect } from 'react';
import { useUserStore } from '@/lib/store/user-store';

export function UsernameDialog() {
  const { username, setUser } = useUserStore();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ハイドレーション後にチェック
    const timer = setTimeout(() => {
      if (!username) {
        setIsOpen(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();

    if (!trimmed) {
      setError('ニックネームを入力してください');
      return;
    }

    if (trimmed.length < 2) {
      setError('2文字以上で入力してください');
      return;
    }

    if (trimmed.length > 20) {
      setError('20文字以内で入力してください');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // APIでユーザーを登録/取得
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '登録に失敗しました');
      }

      const data = await res.json();

      // Zustand + localStorage に保存
      setUser(trimmed, data.visitorId);
      setIsOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold text-[#1d1d1f] mb-2">
          ようこそ GAIS QA Lounge へ
        </h2>
        <p className="text-sm text-[#86868b] mb-6">
          ニックネームを入力してください。質問や回答に表示されます。
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="例: たろう、AI好き、など"
              className="w-full px-4 py-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-xl text-[#1d1d1f] placeholder-[#86868b] focus:outline-none focus:ring-2 focus:ring-[#0066cc] focus:border-transparent transition-all"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-[#0066cc] hover:bg-[#0077ed] disabled:bg-[#d2d2d7] text-white font-medium rounded-xl transition-colors"
          >
            {isSubmitting ? '登録中...' : '始める'}
          </button>
        </form>

        <p className="mt-4 text-xs text-[#86868b] text-center">
          パスワードは不要です。このデバイスで記憶されます。
        </p>
      </div>
    </div>
  );
}
