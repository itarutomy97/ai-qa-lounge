import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { SearchResult } from './search';

export async function generateAnswer(
  question: string,
  searchResults: SearchResult[],
  userProfile?: {
    organizationType?: string;
    jobRole?: string;
  }
): Promise<{ answer: string; sources: SearchResult[] }> {
  // コンテキストを構築
  const context = searchResults
    .map((result, index) => {
      return `[${index + 1}] (${formatTimestamp(result.startTime)})\n${result.text}`;
    })
    .join('\n\n');

  // プロファイルベースのプロンプト調整
  let profileContext = '';
  if (userProfile?.organizationType && userProfile?.jobRole) {
    profileContext = `\n\nユーザーの背景: ${userProfile.organizationType}の${userProfile.jobRole}として働いています。回答は、この背景に合わせて具体例や応用方法を含めてください。`;
  }

  const systemPrompt = `あなたはYouTube動画の内容について質問に答えるアシスタントです。
提供されたコンテキスト（動画の字幕抜粋）のみを使用して、質問に正確に答えてください。
回答には必ず引用元のタイムスタンプ（例: [1] (12:34)）を含めてください。${profileContext}`;

  const userPrompt = `以下のコンテキストを使用して質問に答えてください。

コンテキスト:
${context}

質問: ${question}

回答:`;

  const { text } = await generateText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
  });

  return {
    answer: text,
    sources: searchResults,
  };
}

function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
