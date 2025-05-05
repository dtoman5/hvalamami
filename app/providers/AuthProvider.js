"use client";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { useState } from "react";

export default function AuthProvider({ children }) {
  const [supabaseClient] = useState(() => createClientComponentClient());

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  );
}