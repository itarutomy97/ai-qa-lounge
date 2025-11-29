import { db } from '@/db';
import { episodes, questions, answers, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { VideoPageClient } from '@/components/video-page-client';

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ questionId?: string; q?: string; model?: string }>;
};

export default async function VideoPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { questionId, q, model } = await searchParams;
  const episodeId = parseInt(id, 10);

  if (isNaN(episodeId)) {
    notFound();
  }

  // エピソード情報を取得
  const [episode] = await db
    .select()
    .from(episodes)
    .where(eq(episodes.id, episodeId))
    .limit(1);

  if (!episode) {
    notFound();
  }

  // 自分の質問と回答を取得（questionIdが指定されている場合）
  let myQuestion = null;
  let myAnswer = null;

  if (questionId) {
    const [questionData] = await db
      .select({
        question: questions,
        answer: answers,
      })
      .from(questions)
      .leftJoin(answers, eq(answers.questionId, questions.id))
      .where(eq(questions.id, questionId))
      .limit(1);

    if (questionData) {
      myQuestion = questionData.question;
      myAnswer = questionData.answer;
    }
  }

  // みんなの質問と回答を取得（最新10件、自分の質問は除外）
  const allQuestions = await db
    .select({
      question: questions,
      answer: answers,
      user: users,
    })
    .from(questions)
    .leftJoin(answers, eq(answers.questionId, questions.id))
    .leftJoin(users, eq(users.id, questions.userId))
    .where(eq(questions.episodeId, episodeId))
    .orderBy(desc(questions.createdAt))
    .limit(10);

  // 自分の質問を除外
  const otherQuestions = questionId
    ? allQuestions.filter((q) => q.question.id !== questionId)
    : allQuestions;

  return (
    <VideoPageClient
      episode={episode}
      episodeId={episodeId}
      myQuestion={myQuestion}
      myAnswer={myAnswer}
      otherQuestions={otherQuestions}
      questionId={questionId}
      q={q}
      model={model}
    />
  );
}
