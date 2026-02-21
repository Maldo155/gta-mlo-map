"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

type Props = {
  serverId: string;
  serverUserId: string | null | undefined;
};

export default function EditServerButton({ serverId, serverUserId }: Props) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange((_, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const isOwner = session?.user?.id && serverUserId && session.user.id === serverUserId;
  if (!isOwner) return null;

  return (
    <a
      href={`/servers/${serverId}/edit`}
      style={{
        padding: "10px 18px",
        borderRadius: 8,
        border: "1px solid #6366f1",
        color: "#818cf8",
        textDecoration: "none",
        fontSize: 14,
      }}
    >
      Edit
    </a>
  );
}
