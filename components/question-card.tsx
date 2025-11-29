'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type Question = {
  id: string;
  questionText: string;
  createdAt: string | null;
};

type Answer = {
  answerText: string | null;
  modelUsed: string | null;
  createdAt: string | null;
} | null;

type User = {
  userId: string;
  email: string | null;
} | null;

type QuestionCardProps = {
  question: Question;
  answer: Answer;
  user: User;
  isSelected?: boolean;
  onToggleSelect?: (questionId: string) => void;
  showCheckbox?: boolean;
};

export function QuestionCard({
  question,
  answer,
  user,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
}: QuestionCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    // チェックボックスをクリックした場合は何もしない
    if ((e.target as HTMLElement).closest('input[type="checkbox"]')) {
      return;
    }
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onToggleSelect) {
      onToggleSelect(question.id);
    }
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition-shadow cursor-pointer ${
          isSelected ? 'border-[#0066cc] ring-2 ring-[#0066cc] ring-opacity-50' : 'border-[#d2d2d7]'
        }`}
      >
        <div className="flex items-start gap-3">
          {/* チェックボックス */}
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleCheckboxChange}
              className="mt-1 w-4 h-4 text-[#0066cc] rounded border-[#d2d2d7] focus:ring-[#0066cc] cursor-pointer"
              onClick={(e) => e.stopPropagation()}
            />
          )}

          {/* コンテンツ */}
          <div className="flex-1 min-w-0">
            {/* ユーザー情報 */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-[#0066cc] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">
                  {user?.userId?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="text-xs text-[#86868b] font-medium">
                {user?.userId || 'anonymous'}
              </span>
            </div>

            {/* 質問テキスト */}
            <p className="text-sm text-[#1d1d1f] font-medium mb-2 line-clamp-2">
              {question.questionText}
            </p>

            {/* 回答プレビュー */}
            {answer && (
              <p className="text-xs text-[#86868b] line-clamp-2 mb-2">
                {answer.answerText}
              </p>
            )}

            {/* メタ情報 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#86868b]">
                {new Date(question.createdAt || '').toLocaleDateString('ja-JP')}
              </span>
              <div className="flex items-center gap-2">
                {answer && (
                  <span className="text-xs px-2 py-0.5 bg-[#f5f5f7] text-[#86868b] rounded">
                    {answer.modelUsed}
                  </span>
                )}
                <span className="text-xs text-[#0066cc]">詳細を見る →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#1d1d1f]">
              質問の詳細
            </DialogTitle>
            <DialogDescription className="sr-only">
              質問と回答の詳細を表示しています
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* ユーザー情報 */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#d2d2d7]">
              <div className="w-10 h-10 rounded-full bg-[#0066cc] flex items-center justify-center">
                <span className="text-white text-lg font-medium">
                  {user?.userId?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <p className="font-medium text-[#1d1d1f]">{user?.userId || 'anonymous'}</p>
                <p className="text-xs text-[#86868b]">
                  {new Date(question.createdAt || '').toLocaleString('ja-JP')}
                </p>
              </div>
            </div>

            {/* 質問 */}
            <div>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-[#0066cc] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-medium">Q</span>
                </div>
                <div className="flex-1">
                  <p className="text-[#1d1d1f] font-medium leading-relaxed">
                    {question.questionText}
                  </p>
                </div>
              </div>
            </div>

            {/* 回答 */}
            {answer && (
              <div className="pt-6 border-t border-[#d2d2d7]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#34c759] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-medium">A</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#1d1d1f] whitespace-pre-wrap leading-relaxed">
                      {answer.answerText}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-[#f5f5f7] text-[#86868b] rounded">
                        {answer.modelUsed || 'AI'}
                      </span>
                      <span className="text-xs text-[#86868b]">
                        {answer.createdAt
                          ? new Date(answer.createdAt).toLocaleString('ja-JP')
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!answer && (
              <div className="pt-6 border-t border-[#d2d2d7] text-center">
                <p className="text-[#86868b]">まだ回答がありません</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
