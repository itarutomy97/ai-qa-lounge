import { db } from '@/db';
import { episodes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { HomePageClient } from '@/components/home-page-client';

export default async function Page() {
  // エピソード一覧を取得
  const allEpisodes = await db.select().from(episodes).orderBy(desc(episodes.createdAt));

  return (
    <HomePageClient episodes={allEpisodes} />
  );
}
