import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, visitorId: inputVisitorId } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'ニックネームが必要です' }, { status: 400 });
    }

    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      return NextResponse.json({ error: 'ニックネームは2〜20文字で入力してください' }, { status: 400 });
    }

    // visitorId がある場合はそのユーザーを検索
    if (inputVisitorId) {
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, inputVisitorId))
        .limit(1);

      if (existingUser) {
        // ユーザーが存在する場合、ユーザー名を更新
        await db
          .update(users)
          .set({ userId: trimmedUsername })
          .where(eq(users.id, inputVisitorId));

        return NextResponse.json({
          visitorId: existingUser.id,
          username: trimmedUsername,
          isNew: false,
        });
      }
    }

    // 新しいユーザーを作成
    // userId（ニックネーム）は重複を許可するので、ユニーク制約を回避
    const visitorId = crypto.randomUUID();
    const email = `${visitorId}@visitor.local`; // ダミーのユニークなメール

    const [newUser] = await db
      .insert(users)
      .values({
        id: visitorId,
        userId: trimmedUsername,
        email: email,
      })
      .returning();

    return NextResponse.json({
      visitorId: newUser.id,
      username: trimmedUsername,
      isNew: true,
    });
  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}

// ユーザー情報取得（visitorIdから）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const visitorId = searchParams.get('visitorId');

    if (!visitorId) {
      return NextResponse.json({ error: 'visitorIdが必要です' }, { status: 400 });
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, visitorId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      visitorId: user.id,
      username: user.userId,
    });
  } catch (error) {
    console.error('Error in users GET API:', error);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}
