import { createAdminClient } from '../../../lib/supabase/admin';

export async function POST(req) {
  const { email } = await req.json();
  
  try {
    const supabase = createAdminClient();

    let allUsers = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({ page });
      if (error) throw error;

      allUsers = [...allUsers, ...data.users];
      page++;
      hasMore = data.users.length === 1000;
    }

    const userExists = allUsers.some(
      user => user.email.toLowerCase() === email.toLowerCase()
    );

    return new Response(JSON.stringify({ exists: userExists }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message || "Napaka na strežniku" 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}