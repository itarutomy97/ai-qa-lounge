/**
 * Phase 1〜3の統合テストスクリプト
 *
 * 実行: npx tsx scripts/test-integration.ts
 */

// 環境変数の読み込み（他の何よりも先に実行）
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });

import { db } from '../db';
import { episodes, videoCaptions, users, questions, answers } from '../db/schema';
import { fetchYouTubeTranscript } from '../lib/youtube/transcript';
import { vectorizeEpisode } from '../lib/rag/vectorize';
import { searchSimilarCaptions } from '../lib/rag/search';
import { generateAnswer } from '../lib/rag/generate';
import { eq } from 'drizzle-orm';

const TEST_VIDEO_ID = 'qp0HIF3SfI4'; // Simon Sinek TED Talk
const TEST_QUESTION = 'Why does Apple succeed according to this video?';

async function testPhase1() {
  console.log('\n🔍 Phase 1: データベース接続とスキーマのテスト\n');

  try {
    // テスト用エピソードを作成
    const [episode] = await db
      .insert(episodes)
      .values({
        youtubeVideoId: TEST_VIDEO_ID,
        title: 'Test Episode: How great leaders inspire action',
        description: 'Simon Sinek TED Talk for testing',
        date: new Date().toISOString(),
      })
      .returning();

    console.log('✅ エピソード作成成功');
    console.log(`   ID: ${episode.id}`);
    console.log(`   Title: ${episode.title}`);

    return episode;
  } catch (error) {
    console.error('❌ Phase 1 失敗:', error);
    throw error;
  }
}

async function testPhase2(episodeId: number) {
  console.log('\n🎬 Phase 2: YouTube字幕取得とベクトル化のテスト\n');

  try {
    // Step 1: YouTube字幕取得
    console.log('Step 1: YouTube字幕取得中...');
    const segments = await fetchYouTubeTranscript(TEST_VIDEO_ID);
    console.log(`✅ 字幕取得成功: ${segments.length} セグメント`);
    console.log(`   最初のセグメント: "${segments[0].text}"`);

    // OpenAI API キーの確認
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OPENAI_API_KEY が設定されていないため、ベクトル化をスキップします');
      console.log('   .env.local に OPENAI_API_KEY を設定してください');
      return { segments, vectorized: false };
    }

    // Step 2: ベクトル化
    console.log('\nStep 2: ベクトル化実行中...');
    const vectorizeResult = await vectorizeEpisode(episodeId, segments);
    console.log('✅ ベクトル化成功');
    console.log(`   セグメント数: ${vectorizeResult.segmentsCount}`);
    console.log(`   チャンク数: ${vectorizeResult.chunksCount}`);
    console.log(`   ベクトル数: ${vectorizeResult.vectorsStored}`);

    // ベクトル化されたデータを確認
    const captions = await db
      .select()
      .from(videoCaptions)
      .where(eq(videoCaptions.episodeId, episodeId))
      .limit(3);

    console.log(`\n   保存された字幕チャンク (最初の3件):`);
    captions.forEach((caption, i) => {
      console.log(`   [${i + 1}] ${caption.startTime.toFixed(2)}s: ${caption.text.substring(0, 50)}...`);
    });

    return { segments, vectorized: true };
  } catch (error) {
    console.error('❌ Phase 2 失敗:', error);
    throw error;
  }
}

async function testPhase3(episodeId: number) {
  console.log('\n🤖 Phase 3: RAG検索と回答生成のテスト\n');

  try {
    // OpenAI API キーの確認
    if (!process.env.OPENAI_API_KEY) {
      console.log('⚠️  OPENAI_API_KEY が設定されていないため、Phase 3をスキップします');
      return;
    }

    // Step 1: テストユーザーを作成
    console.log('Step 1: テストユーザー作成中...');
    const [user] = await db
      .insert(users)
      .values({
        userId: 'test-user',
        email: 'test@example.com',
      })
      .returning();

    console.log(`✅ ユーザー作成成功: ${user.email}`);

    // Step 2: RAG検索
    console.log(`\nStep 2: RAG検索実行中...`);
    console.log(`   質問: "${TEST_QUESTION}"`);

    const searchResults = await searchSimilarCaptions(episodeId, TEST_QUESTION, 5);
    console.log(`✅ 検索成功: ${searchResults.length} 件の関連セグメント発見`);

    searchResults.forEach((result, i) => {
      console.log(`\n   [${i + 1}] 類似度: ${(result.similarity * 100).toFixed(1)}%`);
      console.log(`       時間: ${result.startTime.toFixed(2)}s`);
      console.log(`       内容: ${result.text.substring(0, 80)}...`);
    });

    // Step 3: 回答生成
    console.log(`\nStep 3: AI回答生成中...`);
    const { answer, sources } = await generateAnswer(TEST_QUESTION, searchResults);

    console.log(`\n✅ 回答生成成功\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`回答:\n${answer}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Step 4: 質問と回答を保存
    console.log(`\nStep 4: 質問と回答をデータベースに保存中...`);

    const [question] = await db
      .insert(questions)
      .values({
        episodeId,
        userId: user.id,
        questionText: TEST_QUESTION,
      })
      .returning();

    await db
      .insert(answers)
      .values({
        questionId: question.id,
        answerText: answer,
        sources: JSON.stringify(sources),
        modelUsed: 'gpt-4o-mini',
      });

    console.log('✅ 保存成功');

  } catch (error) {
    console.error('❌ Phase 3 失敗:', error);
    throw error;
  }
}

async function cleanup() {
  console.log('\n🧹 テストデータのクリーンアップ中...\n');

  try {
    // テストエピソードを削除（カスケード削除で関連データも削除される）
    await db
      .delete(episodes)
      .where(eq(episodes.youtubeVideoId, TEST_VIDEO_ID));

    // テストユーザーを削除
    await db
      .delete(users)
      .where(eq(users.userId, 'test-user'));

    console.log('✅ クリーンアップ完了');
  } catch (error) {
    console.error('⚠️  クリーンアップ中にエラー:', error);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('   AI QA Lounge - Phase 1〜3 統合テスト');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Phase 1: データベース
    const episode = await testPhase1();

    // Phase 2: YouTube字幕取得とベクトル化
    const { vectorized } = await testPhase2(episode.id);

    // Phase 3: RAG検索と回答生成（ベクトル化が成功した場合のみ）
    if (vectorized) {
      await testPhase3(episode.id);
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   🎉 全ての統合テストが成功しました！');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('   ❌ テストが失敗しました');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.error(error);
  } finally {
    await cleanup();
  }
}

main();
