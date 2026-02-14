export const runtime = "nodejs";

import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  getSupabaseAnon,
} from "@/app/lib/supabaseAdmin";
import { CATEGORIES } from "@/app/lib/categories";

const BUCKET = "mlo-images";
const MIN_ELAPSED_MS = 3000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.key));

async function insertViaDirectDb(
  submission: {
    name: string;
    creator: string;
    website_url: string;
    category: string;
    tag: string | null;
    x: number;
    y: number;
    image_url: string | null;
    notes: string;
    approve_token: string;
    status: string;
  }
): Promise<Error | null> {
  const dbUrl =
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;
  if (!dbUrl) return new Error("No database URL");

  const { Client } = await import("pg");
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    await client.query(
      `INSERT INTO public.mlo_submissions (name, creator, website_url, category, tag, x, y, image_url, notes, approve_token, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        submission.name,
        submission.creator,
        submission.website_url,
        submission.category,
        submission.tag,
        submission.x,
        submission.y,
        submission.image_url,
        submission.notes,
        submission.approve_token,
        submission.status,
      ]
    );
    return null;
  } catch (err) {
    return err instanceof Error ? err : new Error(String(err));
  } finally {
    await client.end();
  }
}

export async function POST(req: Request) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  const form = await req.formData();
  const name = String(form.get("name") || "");
  const creator = String(form.get("creator") || "");
  const websiteUrl = String(form.get("websiteUrl") || "");
  const category = String(form.get("category") || "");
  const x = String(form.get("x") || "");
  const y = String(form.get("y") || "");
  const imageUrl = String(form.get("imageUrl") || "");
  const tag = String(form.get("tag") || "");
  const notes = String(form.get("notes") || "");
  const hp = String(form.get("hp") || "");
  const elapsedMs = Number(form.get("elapsedMs") || 0);
  const captchaA = Number(form.get("captchaA") || 0);
  const captchaB = Number(form.get("captchaB") || 0);
  const captchaAnswer = Number(form.get("captchaAnswer") || 0);
  const imageFile = form.get("imageFile");

  if (hp) {
    return NextResponse.json({ error: "Spam detected" }, { status: 400 });
  }

  if (!Number.isFinite(elapsedMs) || elapsedMs < MIN_ELAPSED_MS) {
    return NextResponse.json({ error: "Slow down" }, { status: 400 });
  }

  if (captchaAnswer !== captchaA + captchaB) {
    return NextResponse.json({ error: "Captcha failed" }, { status: 400 });
  }

  if (!name || !creator || !x || !y) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  if (category && !VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  let finalImageUrl = imageUrl;
  const getClients = [
    () => {
      try {
        return getSupabaseAdmin();
      } catch {
        return null;
      }
    },
    () => {
      try {
        return getSupabaseAnon();
      } catch {
        return null;
      }
    },
  ] as const;

  if (imageFile instanceof Blob) {
    const contentType = imageFile.type || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid image type" }, { status: 400 });
    }
    if (imageFile.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large" }, { status: 400 });
    }
    const filePath = `${crypto.randomUUID()}.png`;
    let uploadError: { message: string } | null = null;
    for (const getClient of getClients) {
      try {
        const supabase = getClient();
        if (!supabase) continue;
        const res = await supabase.storage
          .from(BUCKET)
          .upload(filePath, imageFile, {
            contentType: contentType || "image/png",
            upsert: false,
          });
        if (!res.error) {
          const { data } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(filePath);
          finalImageUrl = data.publicUrl;
          uploadError = null;
          break;
        }
        uploadError = res.error;
        const msg = String(res.error.message || "");
        if (!msg.includes("401") && !msg.includes("Unauthorized")) break;
      } catch {
        continue;
      }
    }
    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }
  }

  const approveToken = crypto.randomUUID();
  const submission = {
    name,
    creator,
    website_url: websiteUrl,
    category,
    tag: tag || null,
    x: Number(x),
    y: Number(y),
    image_url: finalImageUrl || null,
    notes,
    approve_token: approveToken,
    status: "pending",
  };

  let insertError: { message: string } | null = null;
  for (const getClient of getClients) {
    try {
      const supabase = getClient();
      if (!supabase) continue;
      const { error } = await supabase
        .from("mlo_submissions")
        .insert(submission);
      if (!error) {
        insertError = null;
        break;
      }
      insertError = error;
      const msg = String(error.message || "");
      if (!msg.includes("401") && !msg.includes("Unauthorized")) break;
    } catch {
      continue;
    }
  }

  if (insertError) {
    const directErr = await insertViaDirectDb(submission);
    if (!directErr) {
      insertError = null;
    } else if (!insertError.message.includes("401")) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }
  }

  if (insertError) {
    return NextResponse.json(
      {
        error:
          "Add SUPABASE_DB_URL to Vercel: Supabase Dashboard → Settings → Database → Connection string (URI, use pooler). Copy and add as env var, then redeploy.",
      },
      { status: 500 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const adminToken = process.env.ADMIN_API_TOKEN;
  const adminParam = adminToken ? `&admin_token=${adminToken}` : "";
  const approveUrl = `${siteUrl}/api/submissions/approve?token=${approveToken}${adminParam}`;
  const rejectUrl = `${siteUrl}/api/submissions/reject?token=${approveToken}${adminParam}`;
  const viewUrl = siteUrl
    ? `${siteUrl}/map?x=${encodeURIComponent(x)}&y=${encodeURIComponent(y)}`
    : "";

  const payload = {
    content: "New MLO submission",
    embeds: [
      {
        title: name,
        fields: [
          { name: "Creator", value: String(creator), inline: true },
          { name: "X", value: String(x), inline: true },
          { name: "Y", value: String(y), inline: true },
          { name: "Category", value: String(category || "—"), inline: true },
          {
            name: "Website",
            value: String(websiteUrl || "—"),
            inline: false,
          },
          {
            name: "Image",
            value: String(finalImageUrl || "—"),
            inline: false,
          },
          {
            name: "Tag",
            value: String(tag || "—"),
            inline: true,
          },
          {
            name: "View on map",
            value: viewUrl || "—",
            inline: false,
          },
          { name: "Notes", value: String(notes || "—"), inline: false },
        ],
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 3,
            label: "Approve",
            custom_id: `approve:${approveToken}`,
          },
          {
            type: 2,
            style: 4,
            label: "Reject",
            custom_id: `reject:${approveToken}`,
          },
        ],
      },
    ],
  };

  if (botToken && channelId) {
    const res = await fetch(
      `https://discord.com/api/v10/channels/${channelId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${botToken}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("Discord failed:", text);
    }
  } else if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        embeds: [
          {
            ...payload.embeds[0],
            fields: [
              ...payload.embeds[0].fields,
              {
                name: "Approval",
                value: `Approve: ${approveUrl}\nReject: ${rejectUrl}`,
                inline: false,
              },
            ],
          },
        ],
        components: [],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Discord webhook failed:", text);
    }
  }

  return NextResponse.json({ success: true });
}
