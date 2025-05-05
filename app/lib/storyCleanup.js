import { NextResponse } from 'next/server'; // Za vračanje odziva v Next.js

// Funkcija za zakasnitev, da zmanjšamo obremenitev strežnika med poizvedbami
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function cleanupExpiredStories() {
  try {
    const pageSize = 100;  // Velikost paketa za brisanje zgodb (npr. 100 zgodb naenkrat)
    let deletedCount = 0;
    let lastSeenId = null;

    let totalDeleted = 0;
    let startTime = new Date();

    // Zanko za paginirano brisanje zgodb
    while (true) {
      const { data, error } = await supabase
        .from('posts')
        .select('id, expires_at')
        .eq('is_story', true)  // Filtriraj samo zgodbe
        .lt('expires_at', new Date().toISOString())  // Preveri, če je 'expires_at' manjši od trenutnega časa
        .order('expires_at', { ascending: true })  // Razvrsti po `expires_at`, da najprej odstranimo starejše zgodbe
        .limit(pageSize)  // Omeji število zgodb, ki jih obdelamo naenkrat
        .gte('id', lastSeenId || '00000000-0000-0000-0000-000000000000');  // Začetni ID za paginacijo

      if (error) throw error;

      // Če ni več zgodb za brisanje, prekinite zanko
      if (data.length === 0) break;

      // Izbriši zgodbne objave v tej seriji
      const { error: deleteError } = await supabase
        .from('posts')
        .delete()
        .in('id', data.map(post => post.id));

      if (deleteError) throw deleteError;

      // Posodobite `lastSeenId` za naslednji krog
      lastSeenId = data[data.length - 1].id;

      deletedCount += data.length;
      totalDeleted += data.length;

      // Redno logiranje napredka
      if (deletedCount % 1000 === 0) {
        console.log(`Po ${deletedCount} zgodbah, čas: ${Math.round((new Date() - startTime) / 1000)}s`);
      }

      // Dodaj zakasnitev za zmanjšanje obremenitve strežnika
      await delay(500);  // Zamudi za 500 ms med vsakim klicem
    }

    return NextResponse.json(
      { deletedCount: totalDeleted },
      { status: 200 }
    );
  } catch (error) {
    console.error('Napaka pri čiščenju zgodb:', error);
    return NextResponse.json(
      { error: 'Failed to clean up stories' },
      { status: 500 }
    );
  }
}