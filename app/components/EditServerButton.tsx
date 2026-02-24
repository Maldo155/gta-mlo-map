"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/app/lib/supabaseBrowser";

type Props = {
  serverId: string;
  serverUserId: string | null | undefined;
  serverClaimedByUserId?: string | null;
  serverAuthorizedEditors?: string[] | null;
};

export default function EditServerButton({ serverId, serverUserId, serverClaimedByUserId, serverAuthorizedEditors }: Props) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    getSupabaseBrowser()
      .auth.getSession()
      .then(({ data }) => setSession(data.session));
    const { data } = getSupabaseBrowser().auth.onAuthStateChange((_, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  const discordUsername = (session?.user?.user_metadata as Record<string, unknown>)?.user_name ?? (session?.user?.user_metadata as Record<string, unknown>)?.username ?? (session?.user?.user_metadata as Record<string, unknown>)?.full_name;
  const userHandle = typeof discordUsername === "string" ? discordUsername.trim().toLowerCase() : "";
  const editors = (serverAuthorizedEditors ?? []) as string[];
  const isAuthorizedEditor = userHandle && editors.some((e) => String(e).trim().toLowerCase() === userHandle);
  const canEdit = uid && (uid === serverUserId || uid === serverClaimedByUserId || isAuthorizedEditor);
  if (!canEdit) return null;

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
