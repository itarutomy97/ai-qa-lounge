import { NextRequest } from 'next/server';
import { db } from '@/db';
import { questions, answers, userProfiles, users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { searchSimilarCaptions } from '@/lib/rag/search';
import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Vercel Functions のタイムアウト上限を設定
export const maxDuration = 30;

// モデル名のマッピング（UI表示名 → 実際のOpenAIモデル名）
const MODEL_MAPPING: Record<string, string> = {
  'gpt-5': 'gpt-4o',
  'gpt-5-mini': 'gpt-4o-mini',
  'gpt-5-nano': 'gpt-4o-mini',
  'o3': 'o1',
  'gpt-4o': 'gpt-4o',
  'gpt-4o-mini': 'gpt-4o-mini',
  'gpt-4-turbo': 'gpt-4-turbo',
  'gpt-3.5-turbo': 'gpt-3.5-turbo',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { episodeId, visitorId, prompt, model } = body;
    const questionText = prompt; // useCompletionは`prompt`という名前で送信する
    const requestedModel = model || 'gpt-5-mini'; // デフォルトはgpt-5-mini
    const selectedModel = MODEL_MAPPING[requestedModel] || 'gpt-4o-mini'; // 実際のモデル名に変換

    // visitorIdが必須
    if (!visitorId) {
      return new Response(JSON.stringify({ error: 'visitorId is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ユーザーの存在確認
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, visitorId))
      .limit(1);

    if (!existingUser) {
      return new Response(JSON.stringify({ error: 'User not found. Please register first.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userId = visitorId;

    // Step 2: 質問を保存
    const [question] = await db
      .insert(questions)
      .values({
        episodeId,
        userId,
        questionText,
      })
      .returning();

    if (!question) {
      return new Response(JSON.stringify({ error: 'Failed to create question' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Step 3: RAG検索
    const searchResults = await searchSimilarCaptions(episodeId, questionText, 5);

    // Step 4: ユーザープロファイル取得
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // コンテキストを構築
    const context = searchResults
      .map((result, idx) => {
        const minutes = Math.floor(result.startTime / 60);
        const seconds = Math.floor(result.startTime % 60);
        const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        return `[${idx + 1}] (${timestamp}) ${result.text}`;
      })
      .join('\n\n');

    // システムプロンプト
    let systemPrompt = `あなたはYouTube動画の内容に基づいて質問に回答するAIアシスタントです。

以下のコンテキスト（動画の字幕からの抜粋）を参照して、ユーザーの質問に日本語で丁寧に回答してください。

# 回答のガイドライン
- コンテキストに基づいて、具体的で詳細な回答を提供してください
- 重要なポイントを3-5文程度でまとめてください
- 可能な限り、参照箇所のタイムスタンプ [番号] を文中に含めてください（例: 「〜について説明しています [1] (2:22)」）
- コンテキストに情報がない場合は、その旨を正直に伝えてください`;

    if (profile?.organizationType || profile?.jobRole) {
      systemPrompt += `\n\n# ユーザー情報\n組織: ${profile.organizationType || '不明'}\n役職: ${profile.jobRole || '不明'}`;
    }

    systemPrompt += `\n\n# コンテキスト（動画字幕）\n${context}`;

    // Step 5: ストリーミング回答生成
    const result = await streamText({
      model: openai(selectedModel),
      system: systemPrompt,
      prompt: `質問: ${questionText}`,
      temperature: 0.7,
      onFinish: async ({ text }) => {
        // ストリーミング完了後にDBに保存
        try {
          await db.insert(answers).values({
            questionId: question.id,
            answerText: text,
            sources: JSON.stringify(
              searchResults.map((s) => ({
                caption_id: s.id,
                start_time: s.startTime,
                text: s.text,
                similarity: s.similarity,
              }))
            ),
            modelUsed: requestedModel, // UIで選択されたモデル名を保存
          });
        } catch (error) {
          console.error('Error saving answer:', error);
        }
      },
    });

    // ソース情報をヘッダーに含める
    const sourcesHeader = JSON.stringify(
      searchResults.map((s) => ({
        startTime: s.startTime,
        text: s.text,
        similarity: s.similarity,
      }))
    );

    return result.toTextStreamResponse({
      headers: {
        'X-Question-Id': question.id.toString(),
        'X-Sources': encodeURIComponent(sourcesHeader),
      },
    });
  } catch (error) {
    console.error('Error processing question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
