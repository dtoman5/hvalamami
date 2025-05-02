import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Izračun trenutnega časa - 24 ur
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() - 24);

    // Poizvedba za brisanje zgodb, katerih 'expires_at' je manjši od trenutnega časa - 24 ur
    const { data, error } = await supabase
      .from('posts')
      .delete()
      .eq('is_story', true) // Filtriramo samo zgodbe
      .lt('expires_at', expirationTime.toISOString()); // Preverimo, če je 'expires_at' manjši od 24 ur nazaj

    if (error) throw error;

    return NextResponse.json(
      { deletedCount: data?.length || 0 },  // Vračanje števila izbrisanih zgodb
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