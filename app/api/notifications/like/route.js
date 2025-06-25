import { createNotificationWithPush } from '../../../../lib/notifications/server';

export async function POST(req) {
  try {
    const body = await req.json();
    await createNotificationWithPush({ ...body, type: 'like' });
    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('❌ Napaka pri like obvestilu:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}