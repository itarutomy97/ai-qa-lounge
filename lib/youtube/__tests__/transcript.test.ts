import { describe, it, expect } from 'vitest';
import { fetchYouTubeTranscript, formatTimestamp, parseVideoId } from '../transcript';

describe('YouTube Transcript', () => {
  describe('formatTimestamp', () => {
    it('should format seconds correctly (under 1 hour)', () => {
      expect(formatTimestamp(0)).toBe('0:00');
      expect(formatTimestamp(30)).toBe('0:30');
      expect(formatTimestamp(90)).toBe('1:30');
      expect(formatTimestamp(600)).toBe('10:00');
      expect(formatTimestamp(3599)).toBe('59:59');
    });

    it('should format seconds correctly (over 1 hour)', () => {
      expect(formatTimestamp(3600)).toBe('1:00:00');
      expect(formatTimestamp(3661)).toBe('1:01:01');
      expect(formatTimestamp(7200)).toBe('2:00:00');
    });
  });

  describe('parseVideoId', () => {
    it('should extract video ID from various YouTube URL formats', () => {
      expect(parseVideoId('https://www.youtube.com/watch?v=qp0HIF3SfI4')).toBe('qp0HIF3SfI4');
      expect(parseVideoId('https://youtu.be/qp0HIF3SfI4')).toBe('qp0HIF3SfI4');
      expect(parseVideoId('https://www.youtube.com/embed/qp0HIF3SfI4')).toBe('qp0HIF3SfI4');
    });

    it('should return the ID if already an 11-character video ID', () => {
      expect(parseVideoId('qp0HIF3SfI4')).toBe('qp0HIF3SfI4');
    });

    it('should return null for invalid inputs', () => {
      expect(parseVideoId('invalid')).toBe(null);
      expect(parseVideoId('https://example.com')).toBe(null);
    });
  });

  describe('fetchYouTubeTranscript', () => {
    // Note: 実際のAPI呼び出しを行うため、このテストはE2Eテストとして扱う
    it.skip('should fetch transcript for a valid video ID (E2E test)', async () => {
      // テスト用の有名なTED Talk動画
      const videoId = 'qp0HIF3SfI4';

      const segments = await fetchYouTubeTranscript(videoId);

      expect(segments).toBeDefined();
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      // 最初のセグメントの構造を検証
      const firstSegment = segments[0];
      expect(firstSegment).toHaveProperty('start');
      expect(firstSegment).toHaveProperty('duration');
      expect(firstSegment).toHaveProperty('text');
      expect(typeof firstSegment.start).toBe('number');
      expect(typeof firstSegment.duration).toBe('number');
      expect(typeof firstSegment.text).toBe('string');
    }, 30000); // 30秒のタイムアウト

    it.skip('should throw an error for invalid video ID (E2E test)', async () => {
      await expect(fetchYouTubeTranscript('invalid123')).rejects.toThrow();
    }, 30000);
  });
});
