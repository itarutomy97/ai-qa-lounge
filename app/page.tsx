import { db } from '@/db';
import { episodes, questions, users } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { HomePageClient } from '@/components/home-page-client';

export default async function Page() {
  // エピソード一覧を取得
  const allEpisodes = await db.select().from(episodes).orderBy(desc(episodes.createdAt));

  // 匿名ユーザーの質問済みエピソードIDを取得
  const [anonymousUser] = await db
    .select()
    .from(users)
    .where(eq(users.userId, 'anonymous'))
    .limit(1);

  let userQuestionedEpisodeIds: number[] = [];

  if (anonymousUser) {
    const userQuestions = await db
      .select({ episodeId: questions.episodeId })
      .from(questions)
      .where(eq(questions.userId, anonymousUser.id));

    userQuestionedEpisodeIds = [...new Set(userQuestions.map(q => q.episodeId))];
  }

  return (
    <HomePageClient
      episodes={allEpisodes}
      userQuestionedEpisodeIds={userQuestionedEpisodeIds}
    />
  );
}
