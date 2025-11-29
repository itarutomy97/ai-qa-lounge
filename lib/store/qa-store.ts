import { create } from 'zustand';

type QAState = {
  // 現在の質問・回答状態
  currentQuestion: {
    questionId: string;
    episodeId: number;
    questionText: string;
    model?: string;
    completion: string;
    isLoading: boolean;
  } | null;

  // アクション
  setCurrentQuestion: (question: {
    questionId: string;
    episodeId: number;
    questionText: string;
    model?: string;
  }) => void;
  setQuestionId: (questionId: string) => void;
  updateCompletion: (completion: string) => void;
  setLoading: (isLoading: boolean) => void;
  clearQuestion: () => void;
};

export const useQAStore = create<QAState>((set) => ({
  currentQuestion: null,

  setCurrentQuestion: (question) =>
    set({
      currentQuestion: {
        ...question,
        completion: '',
        isLoading: true,
      },
    }),

  setQuestionId: (questionId) =>
    set((state) =>
      state.currentQuestion
        ? {
            currentQuestion: {
              ...state.currentQuestion,
              questionId,
            },
          }
        : state
    ),

  updateCompletion: (completion) =>
    set((state) =>
      state.currentQuestion
        ? {
            currentQuestion: {
              ...state.currentQuestion,
              completion,
            },
          }
        : state
    ),

  setLoading: (isLoading) =>
    set((state) =>
      state.currentQuestion
        ? {
            currentQuestion: {
              ...state.currentQuestion,
              isLoading,
            },
          }
        : state
    ),

  clearQuestion: () => set({ currentQuestion: null }),
}));
