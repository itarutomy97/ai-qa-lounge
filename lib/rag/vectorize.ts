import { db } from '@/db';
import { videoCaptions, episodes } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';
import { TranscriptSegment } from '../youtube/transcript';

// 字幕セグメントを意味のあるチャンクにまとめる（約200-300 tokens）
function chunkTranscript(
  segments: TranscriptSegment[],
  maxChunkSize: number = 300
): Array<{ segments: TranscriptSegment[]; text: string; startTime: number }> {
  const chunks: Array<{
    segments: TranscriptSegment[];
    text: string;
    startTime: number;
  }> = [];
  let currentChunk: TranscriptSegment[] = [];
  let currentText = '';
  let currentTokens = 0;

  for (const segment of segments) {
    const segmentTokens = segment.text.split(' ').length;

    if (currentTokens + segmentTokens > maxChunkSize && currentChunk.length > 0) {
      chunks.push({
        segments: [...currentChunk],
        text: currentText.trim(),
        startTime: currentChunk[0].start,
      });
      currentChunk = [];
      currentText = '';
      currentTokens = 0;
    }

    currentChunk.push(segment);
    currentText += segment.text + ' ';
    currentTokens += segmentTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push({
      segments: [...currentChunk],
      text: currentText.trim(),
      startTime: currentChunk[0].start,
    });
  }

  return chunks;
}

export async function vectorizeEpisode(
  episodeId: number,
  segments: TranscriptSegment[]
) {
  // Step 1: チャンクに分割
  const chunks = chunkTranscript(segments);

  // Step 2: OpenAI Embeddings API で一括ベクトル化
  const { embeddings } = await embedMany({
    model: openai.embedding('text-embedding-3-small'),
    values: chunks.map((chunk) => chunk.text),
  });

  // Step 3: 字幕 + ベクトルをTursoに保存
  const captionInserts = chunks.map((chunk, index) => {
    const lastSegment = chunk.segments[chunk.segments.length - 1];
    const duration = lastSegment.start + lastSegment.duration - chunk.startTime;

    return {
      episodeId,
      startTime: chunk.startTime,
      duration,
      text: chunk.text,
      embedding: embeddings[index],
    };
  });

  await db.insert(videoCaptions).values(captionInserts);

  // Step 4: エピソードのステータスを更新
  await db
    .update(episodes)
    .set({
      captionFetched: true,
      vectorized: true,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(episodes.id, episodeId));

  return {
    segmentsCount: segments.length,
    chunksCount: chunks.length,
    vectorsStored: embeddings.length,
  };
}
