import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function cleanupExpiredStories() {
  const supabase = createClient();

  try {
    const pageSize = 100;
    let deletedCount = 0;
    let lastSeenId = null;

    let totalDeleted = 0;
    let startTime = new Date();

    while (true) {
      const { data, error } = await supabase
        .from('posts')
        .select('id, expires_at')
        .eq('is_story', true)
        .lt('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: true })
        .limit(pageSize)
        .gte('id', lastSeenId || '00000000-0000-0000-0000-000000000000');

      if (error) throw error;
      if (!data.length) break;

      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .in('id', data.map(post => post.id));

      if (deleteError) throw deleteError;

      lastSeenId = data[data.length - 1].id;
      deletedCount += data.length;
      totalDeleted += data.length;

      if (deletedCount % 1000 === 0) {
        console.log(`Po ${deletedCount} zgodbah, čas: ${Math.round((new Date() - startTime) / 1000)}s`);
      }

      await delay(500);
    }

    return NextResponse.json({ deletedCount: totalDeleted }, { status: 200 });
  } catch (error) {
    console.error('Napaka pri čiščenju zgodb:', error);
    return NextResponse.json({ error: 'Failed to clean up stories' }, { status: 500 });
  }
}