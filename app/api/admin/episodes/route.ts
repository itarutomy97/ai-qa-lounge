import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { episodes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { fetchYouTubeTranscript } from '@/lib/youtube/transcript';
import { vectorizeEpisode } from '@/lib/rag/vectorize';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { youtubeVideoId, newsletterId, title, description, date } = body;

    // Step 1: エピソード登録
    const [episode] = await db
      .insert(episodes)
      .values({
        youtubeVideoId,
        newsletterId,
        title,
        description,
        date,
      })
      .returning();

    if (!episode) {
      return NextResponse.json(
        { error: 'Failed to create episode' },
        { status: 400 }
      );
    }

    // Step 2: YouTube字幕取得
    const transcript = await fetchYouTubeTranscript(youtubeVideoId);

    // Step 3: ベクトル化（バックグラウンド処理）
    // 本番ではQueueを使うべきだが、MVPでは同期処理
    const vectorizeResult = await vectorizeEpisode(episode.id, transcript);

    return NextResponse.json({
      episode,
      transcript: {
        segmentCount: transcript.length,
      },
      vectorize: vectorizeResult,
    });
  } catch (error: any) {
    console.error('Error creating episode:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const allEpisodes = await db
      .select()
      .from(episodes)
      .orderBy(desc(episodes.createdAt));

    return NextResponse.json({ episodes: allEpisodes });
  } catch (error: any) {
    console.error('Error fetching episodes:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
