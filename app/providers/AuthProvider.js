'use client';
import { createClient } from '@/lib/supabase/client';
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function AuthProvider({ children }) {
  const [supabaseClient] = useState(() => createClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}