import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { episodes } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { fetchYouTubeTranscript, parseVideoId } from '@/lib/youtube/transcript';
import { vectorizeEpisode } from '@/lib/rag/vectorize';
import { Innertube } from 'youtubei.js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'videoUrl is required' },
        { status: 400 }
      );
    }

    // Step 1: YouTube URLからビデオIDを抽出
    const videoId = parseVideoId(videoUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // Step 2: YouTube APIから動画情報を取得
    // 注: YouTubeJSのパーサー警告が出ることがありますが、データは正常に取得できます
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);

    const title = videoInfo.basic_info.title || 'Untitled Video';
    const description = videoInfo.basic_info.short_description || '';

    // Step 3: エピソード登録
    const [episode] = await db
      .insert(episodes)
      .values({
        youtubeVideoId: videoId,
        title,
        description,
        date: new Date().toISOString(),
      })
      .returning();

    if (!episode) {
      return NextResponse.json(
        { error: 'Failed to create episode' },
        { status: 400 }
      );
    }

    // Step 4: YouTube字幕取得
    const transcript = await fetchYouTubeTranscript(videoId);

    if (!transcript || transcript.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch transcript. Video may not have captions available.' },
        { status: 400 }
      );
    }

    // Step 5: ベクトル化（バックグラウンド処理）
    // 本番ではQueueを使うべきだが、MVPでは同期処理
    const vectorizeResult = await vectorizeEpisode(episode.id, transcript);

    return NextResponse.json({
      episode,
      transcript: {
        segmentCount: transcript.length,
      },
      vectorize: vectorizeResult,
    });
  } catch (error) {
    console.error('Error creating episode:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const allEpisodes = await db
      .select()
      .from(episodes)
      .orderBy(desc(episodes.createdAt));

    return NextResponse.json({ episodes: allEpisodes });
  } catch (error) {
    console.error('Error fetching episodes:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
