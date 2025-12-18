import { YoutubeTranscript } from 'youtube-transcript';
import { Innertube } from 'youtubei.js';

export interface TranscriptSegment {
  start: number; // 秒
  duration: number;
  text: string;
}

export async function fetchYouTubeTranscript(
  videoId: string
): Promise<TranscriptSegment[]> {
  // まずyoutube-transcriptを試す
  try {
    console.log(`[Transcript] Trying youtube-transcript for ${videoId}`);
    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: 'ja',
    });

    if (transcript && transcript.length > 0) {
      console.log(`[Transcript] Successfully fetched ${transcript.length} segments with youtube-transcript`);
      return transcript.map((item) => ({
        start: item.offset / 1000, // ミリ秒から秒に変換
        duration: item.duration / 1000,
        text: item.text,
      }));
    }
  } catch (error) {
    console.log(`[Transcript] youtube-transcript failed, trying English...`, error);

    // 日本語がなければ英語を試す
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
      });

      if (transcript && transcript.length > 0) {
        console.log(`[Transcript] Successfully fetched ${transcript.length} segments (English)`);
        return transcript.map((item) => ({
          start: item.offset / 1000,
          duration: item.duration / 1000,
          text: item.text,
        }));
      }
    } catch {
      console.log(`[Transcript] youtube-transcript English also failed, trying youtubei.js...`);
    }
  }

  // フォールバック: youtubei.jsを試す
  try {
    console.log(`[Transcript] Trying youtubei.js for ${videoId}`);
    const youtube = await Innertube.create();
    const info = await youtube.getInfo(videoId);
    const transcriptData = await info.getTranscript();

    const segments = transcriptData?.transcript?.content?.body?.initial_segments || [];

    if (segments.length === 0) {
      throw new Error('No transcript available for this video');
    }

    console.log(`[Transcript] Successfully fetched ${segments.length} segments with youtubei.js`);
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
  } catch (error) {
    console.error(`[Transcript] All methods failed for ${videoId}:`, error);
    throw new Error(`Transcript fetch failed: No transcript available for this video`);
  }
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
