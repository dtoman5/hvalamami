import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('is_story', true)
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;

    return NextResponse.json(
      { deletedCount: data?.length || 0 },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to clean up stories' },
      { status: 500 }
    );
  }
}