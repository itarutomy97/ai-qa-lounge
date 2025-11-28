import { db } from '@/db';
import { videoCaptions } from '@/db/schema';
import { eq, sql, desc } from 'drizzle-orm';
import { embed } from 'ai';
import { openai } from '@ai-sdk/openai';

export interface SearchResult {
  id: number;
  episodeId: number;
  startTime: number;
  text: string;
  similarity: number;
}

export async function searchSimilarCaptions(
  episodeId: number,
  query: string,
  topK: number = 5
): Promise<SearchResult[]> {
  // Step 1: クエリをベクトル化
  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  });

  // Step 2: Turso でベクトル類似度検索（コサイン類似度）
  // 1 - vector_distance_cos で類似度を計算（1に近いほど類似）
  const similarity = sql<number>`1 - vector_distance_cos(${videoCaptions.embedding}, vector32(${JSON.stringify(embedding)}))`;

  const results = await db
    .select({
      id: videoCaptions.id,
      episodeId: videoCaptions.episodeId,
      startTime: videoCaptions.startTime,
      text: videoCaptions.text,
      similarity: similarity,
    })
    .from(videoCaptions)
    .where(eq(videoCaptions.episodeId, episodeId))
    .orderBy(desc(similarity))
    .limit(topK);

  return results as SearchResult[];
}
