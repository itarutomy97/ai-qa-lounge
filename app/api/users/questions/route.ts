import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { questions } from '@/db/schema';
import { eq } from 'drizzle-orm';

// ユーザーが質問したエピソードID一覧を取得
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json({ episodeIds: [] });
    }

    const userQuestions = await db
      .select({ episodeId: questions.episodeId })
      .from(questions)
      .where(eq(questions.userId, visitorId));

    const episodeIds = [...new Set(userQuestions.map(q => q.episodeId))];

    return NextResponse.json({ episodeIds });
  } catch (error) {
    console.error('Error fetching user questions:', error);
    return NextResponse.json({ episodeIds: [] });
  }
}
