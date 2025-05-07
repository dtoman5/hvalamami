'use client';

import { useState } from "react";
import { createClient } from '@/lib/supabase/client';
import { SessionContextProvider } from '@supabase/auth-helpers-react'; // <- MANJKAJOČ UVOZ

export default function AuthProvider({ children }) {
  const [supabaseClient] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}