'use client';
import { createClient } from '@/lib/supabase/client';
import { useState } from "react";

export default function AuthProvider({ children }) {
  const [supabaseClient] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}