export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";
import { createLiveChatThread, postToThread } from "@/app/lib/discordChat";

const MAX_MESSAGE = 2000;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string) {
  return UUID_RE.test(s.trim());
}

function adminClient() {
  try {
    return { ok: true as const, supabase: getSupabaseAdmin() };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Chat unavailable";
    console.error("[chat] Supabase admin:", message);
    return { ok: false as const, message };
  }
}

export async function GET(req: Request) {
  const admin = adminClient();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Chat temporarily unavailable", messages: [] },
      { status: 503 }
    );
  }
  const { supabase } = admin;

  const { searchParams } = new URL(req.url);
  const threadId = searchParams.get("threadId");
  if (!threadId) {
    return NextResponse.json({ error: "Missing threadId" }, { status: 400 });
  }
  if (!isUuid(threadId)) {
    return NextResponse.json({ error: "Invalid threadId" }, { status: 400 });
  }

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("id, content, from_visitor, created_at")
    .eq("thread_id", threadId.trim())
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(req: Request) {
  const admin = adminClient();
  if (!admin.ok) {
    return NextResponse.json(
      { error: "Chat temporarily unavailable" },
      { status: 503 }
    );
  }
  const { supabase } = admin;

  const body = (await req.json().catch(() => ({}))) as {
    threadId?: string;
    name?: string;
    email?: string;
    message?: string;
  };

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim().slice(0, MAX_MESSAGE);
  const threadId = body.threadId?.trim();

  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  if (threadId && !isUuid(threadId)) {
    return NextResponse.json(
      { error: "Invalid chat session. Please end the chat and start again." },
      { status: 400 }
    );
  }

  let resolvedThreadId = threadId;
  let isNewThread = false;

  if (!resolvedThreadId) {
    if (!name || !email) {
      return NextResponse.json({ error: "Name and email required for new chat" }, { status: 400 });
    }
    const { data: thread, error: threadErr } = await supabase
      .from("chat_threads")
      .insert({ name, email })
      .select("id")
      .single();

    if (threadErr || !thread) {
      return NextResponse.json({ error: threadErr?.message || "Failed to create chat" }, { status: 500 });
    }
    resolvedThreadId = thread.id;
    isNewThread = true;

    const { data: threadRow } = await supabase
      .from("chat_threads")
      .select("name, email")
      .eq("id", resolvedThreadId)
      .single();
    const displayName = threadRow?.name || name || "Unknown";
    const discordThreadId = await createLiveChatThread(displayName, {
      title: "New Live Chat",
      fields: [
        { name: "Thread ID", value: `\`${resolvedThreadId}\``, inline: false },
        { name: "Name", value: displayName, inline: true },
        { name: "Email", value: threadRow?.email || email || "—", inline: true },
        { name: "Message", value: message.slice(0, 1000) + (message.length > 1000 ? "…" : ""), inline: false },
      ],
    });
    if (discordThreadId) {
      await supabase.from("chat_threads").update({ discord_channel_id: discordThreadId }).eq("id", resolvedThreadId);
    }
  }

  const { data: msg, error: msgErr } = await supabase
    .from("chat_messages")
    .insert({
      thread_id: resolvedThreadId,
      from_visitor: true,
      content: message,
    })
    .select("id, created_at")
    .single();

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  if (isNewThread) {
    const autoReply = "Thank you for reaching out! Our team will get back to you as soon as possible.";
    await supabase.from("chat_messages").insert({
      thread_id: resolvedThreadId,
      from_visitor: false,
      content: autoReply,
    });
  }

  if (!isNewThread) {
    const { data: threadRow2 } = await supabase
      .from("chat_threads")
      .select("discord_channel_id, name, email")
      .eq("id", resolvedThreadId)
      .single();
    const discordThreadId = threadRow2?.discord_channel_id;
    const embed = {
      title: "New Message",
      fields: [
        { name: "Thread ID", value: `\`${resolvedThreadId}\``, inline: false },
        { name: "Name", value: threadRow2?.name || name || "Unknown", inline: true },
        { name: "Email", value: threadRow2?.email || email || "—", inline: true },
        { name: "Message", value: message.slice(0, 1000) + (message.length > 1000 ? "…" : ""), inline: false },
      ],
    };
    if (discordThreadId) {
      await postToThread(discordThreadId, embed);
    } else {
      const created = await createLiveChatThread(threadRow2?.name || name || "Unknown", embed);
      if (created) {
        await supabase.from("chat_threads").update({ discord_channel_id: created }).eq("id", resolvedThreadId);
      }
    }
  }

  const responseMessages = [{ id: msg?.id, content: message, from_visitor: true, created_at: msg?.created_at }];
  if (isNewThread) {
    const { data: allMsgs } = await supabase
      .from("chat_messages")
      .select("id, content, from_visitor, created_at")
      .eq("thread_id", resolvedThreadId)
      .order("created_at", { ascending: true });
    const msgs = (allMsgs ?? []) as {
      id: string;
      content: string;
      from_visitor: boolean;
      created_at: string;
    }[];
    return NextResponse.json({ threadId: resolvedThreadId, messageId: msg?.id, isNewThread, messages: msgs });
  }

  return NextResponse.json({
    threadId: resolvedThreadId,
    messageId: msg?.id,
    isNewThread,
    messages: responseMessages,
  });
}
