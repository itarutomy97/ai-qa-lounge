import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions, answers, userProfiles } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { searchSimilarCaptions } from '@/lib/rag/search';
import { generateAnswer } from '@/lib/rag/generate';

export async function POST(req: NextRequest) {
  try {
    const { episodeId, userId, questionText } = await req.json();

    // Step 1: 質問を保存
    const [question] = await db
      .insert(questions)
      .values({
        episodeId,
        userId,
        questionText,
      })
      .returning();

    if (!question) {
      return NextResponse.json(
        { error: 'Failed to create question' },
        { status: 400 }
      );
    }

    // Step 2: RAG検索
    const searchResults = await searchSimilarCaptions(
      episodeId,
      questionText,
      5
    );

    // Step 3: ユーザープロファイル取得
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId))
      .limit(1);

    // Step 4: 回答生成
    const { answer, sources } = await generateAnswer(
      questionText,
      searchResults,
      profile ? {
        organizationType: profile.organizationType || undefined,
        jobRole: profile.jobRole || undefined,
      } : undefined
    );

    // Step 5: 回答を保存
    const [answerData] = await db
      .insert(answers)
      .values({
        questionId: question.id,
        answerText: answer,
        sources: JSON.stringify(sources.map((s) => ({
          caption_id: s.id,
          start_time: s.startTime,
          text: s.text,
          similarity: s.similarity,
        }))),
        modelUsed: 'gpt-4o-mini',
      })
      .returning();

    if (!answerData) {
      return NextResponse.json(
        { error: 'Failed to save answer' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      question,
      answer: answerData.answerText,
      sources,
    });
  } catch (error: any) {
    console.error('Error processing question:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
