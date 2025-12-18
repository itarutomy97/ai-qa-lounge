import { YoutubeTranscript } from 'youtube-transcript';
import { getSubtitles } from 'youtube-caption-extractor';
import { Innertube } from 'youtubei.js';

export interface TranscriptSegment {
  start: number; // 秒
  duration: number;
  text: string;
}

export async function fetchYouTubeTranscript(
  videoId: string
): Promise<TranscriptSegment[]> {
  // Method 1: youtube-transcript（日本語）
  try {
    console.log(`[Transcript] Method 1: youtube-transcript (ja) for ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'ja',
    });

    if (transcript && transcript.length > 0) {
      console.log(`[Transcript] Success with youtube-transcript (ja): ${transcript.length} segments`);
      return transcript.map((item) => ({
        start: item.offset / 1000,
        duration: item.duration / 1000,
        text: item.text,
      }));
    }
  } catch (error) {
    console.log(`[Transcript] Method 1 failed:`, error instanceof Error ? error.message : error);
  }

  // Method 2: youtube-transcript（英語）
  try {
    console.log(`[Transcript] Method 2: youtube-transcript (en) for ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'en',
    });

    if (transcript && transcript.length > 0) {
      console.log(`[Transcript] Success with youtube-transcript (en): ${transcript.length} segments`);
      return transcript.map((item) => ({
        start: item.offset / 1000,
        duration: item.duration / 1000,
        text: item.text,
      }));
    }
  } catch (error) {
    console.log(`[Transcript] Method 2 failed:`, error instanceof Error ? error.message : error);
  }

  // Method 3: youtube-transcript（言語指定なし）
  try {
    console.log(`[Transcript] Method 3: youtube-transcript (auto) for ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    if (transcript && transcript.length > 0) {
      console.log(`[Transcript] Success with youtube-transcript (auto): ${transcript.length} segments`);
      return transcript.map((item) => ({
        start: item.offset / 1000,
        duration: item.duration / 1000,
        text: item.text,
      }));
    }
  } catch (error) {
    console.log(`[Transcript] Method 3 failed:`, error instanceof Error ? error.message : error);
  }

  // Method 4: youtube-caption-extractor（日本語）
  try {
    console.log(`[Transcript] Method 4: youtube-caption-extractor (ja) for ${videoId}`);
    const subtitles = await getSubtitles({ videoID: videoId, lang: 'ja' });

    if (subtitles && subtitles.length > 0) {
      console.log(`[Transcript] Success with youtube-caption-extractor (ja): ${subtitles.length} segments`);
      return subtitles.map((item) => ({
        start: parseFloat(item.start),
        duration: parseFloat(item.dur),
        text: item.text,
      }));
    }
  } catch (error) {
    console.log(`[Transcript] Method 4 failed:`, error instanceof Error ? error.message : error);
  }

  // Method 5: youtube-caption-extractor（英語）
  try {
    console.log(`[Transcript] Method 5: youtube-caption-extractor (en) for ${videoId}`);
    const subtitles = await getSubtitles({ videoID: videoId, lang: 'en' });

    if (subtitles && subtitles.length > 0) {
      console.log(`[Transcript] Success with youtube-caption-extractor (en): ${subtitles.length} segments`);
      return subtitles.map((item) => ({
        start: parseFloat(item.start),
        duration: parseFloat(item.dur),
        text: item.text,
      }));
    }
  } catch (error) {
    console.log(`[Transcript] Method 5 failed:`, error instanceof Error ? error.message : error);
  }

  // Method 6: youtubei.js（最後の手段）
  try {
    console.log(`[Transcript] Method 6: youtubei.js for ${videoId}`);
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    const segments = transcriptData?.transcript?.content?.body?.initial_segments || [];

    if (segments.length > 0) {
      console.log(`[Transcript] Success with youtubei.js: ${segments.length} segments`);
      return segments.map((segment) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const seg = segment as any;
        const startMs = typeof seg.start_ms === 'string' ? parseFloat(seg.start_ms) : seg.start_ms;
        const endMs = typeof seg.end_ms === 'string' ? parseFloat(seg.end_ms) : seg.end_ms;

        return {
          start: startMs / 1000,
          duration: (endMs - startMs) / 1000,
          text: seg.snippet?.text || '',
        };
      });
    }
  } catch (error) {
    console.log(`[Transcript] Method 6 failed:`, error instanceof Error ? error.message : error);
  }

  // すべて失敗
  console.error(`[Transcript] All methods failed for ${videoId}`);
  throw new Error(`Transcript fetch failed: No transcript available for this video`);
}

export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function parseVideoId(url: string): string | null {
  // YouTube URL から video ID を抽出
  const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  } else if (url.length === 11) {
    // URLではなくIDが直接渡された場合
    return url;
  }
  return null;
}
