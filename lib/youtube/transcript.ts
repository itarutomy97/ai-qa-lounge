import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptSegment {
  start: number; // 秒
  duration: number;
  text: string;
}

export async function fetchYouTubeTranscript(
  videoId: string
): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    return transcript.map((segment: any) => ({
      start: segment.offset / 1000, // ミリ秒から秒に変換
      duration: segment.duration / 1000,
      text: segment.text,
    }));
  } catch (error) {
    console.error(`Failed to fetch transcript for ${videoId}:`, error);
    throw new Error(`Transcript fetch failed: ${error}`);
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
