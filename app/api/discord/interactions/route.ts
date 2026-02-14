import { NextResponse } from "next/server";
import nacl from "tweetnacl";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

export const runtime = "nodejs";

function verifySignature(
  rawBody: Uint8Array,
  signature: string,
  timestamp: string
) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) return false;
  const message = Buffer.concat([Buffer.from(timestamp), Buffer.from(rawBody)]);
  const sig = Buffer.from(signature, "hex");
  const key = Buffer.from(publicKey, "hex");
  return nacl.sign.detached.verify(message, sig, key);
}

export async function POST(req: Request) {
  const signature = req.headers.get("x-signature-ed25519") || "";
  const timestamp = req.headers.get("x-signature-timestamp") || "";
  const rawBodyBuffer = new Uint8Array(await req.arrayBuffer());
  const rawBody = new TextDecoder().decode(rawBodyBuffer);

  if (!verifySignature(rawBodyBuffer, signature, timestamp)) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(rawBody);
  const user = body.member?.user || body.user;
  const approver = user?.username
    ? `${user.username}${user.discriminator && user.discriminator !== "0" ? `#${user.discriminator}` : ""}`
    : "Unknown user";

  // Ping
  if (body.type === 1) {
    return NextResponse.json({ type: 1 });
  }

  // Button interactions
  if (body.type === 3) {
    const customId = body.data?.custom_id || "";
    const [action, token] = customId.split(":");
    const interactionToken = body.token as string | undefined;
    const applicationId = body.application_id as string | undefined;

    if (!token) {
      return NextResponse.json({
        type: 4,
        data: { content: "Invalid token", flags: 64 },
      });
    }

    if (!interactionToken || !applicationId) {
      return NextResponse.json({
        type: 4,
        data: { content: "Missing interaction token", flags: 64 },
      });
    }

    const followupUrl = `https://discord.com/api/v10/webhooks/${applicationId}/${interactionToken}`;
    const updateOriginal = async (content: string) => {
      try {
        await fetch(`${followupUrl}/messages/@original`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, components: [] }),
        });
      } catch {
        // Intentionally ignore follow-up errors
      }
    };

    if (action === "approve") {
      const { data, error } = await getSupabaseAdmin()
        .from("mlo_submissions")
        .select("*")
        .eq("approve_token", token)
        .eq("status", "pending")
        .single();

      if (error || !data) {
        return NextResponse.json({
          type: 7,
          data: { content: "Submission not found", components: [] },
        });
      }

      const { error: insertError } = await getSupabaseAdmin().from("mlos").insert({
        name: data.name,
        creator: data.creator,
        website_url: data.website_url,
        category: data.category,
        tag: data.tag || null,
        x: data.x,
        y: data.y,
        image_url: data.image_url,
      });

      if (insertError) {
        return NextResponse.json({
          type: 7,
          data: { content: insertError.message, components: [] },
        });
      }

      const { error: updateError } = await getSupabaseAdmin()
        .from("mlo_submissions")
        .update({ status: "approved" })
        .eq("id", data.id);

      if (updateError) {
        return NextResponse.json({
          type: 7,
          data: { content: updateError.message, components: [] },
        });
      }

      const message = `Approved ✅ by ${approver}`;
      return NextResponse.json({
        type: 7,
        data: { content: message, components: [] },
      });
    }

    if (action === "reject") {
      const { error } = await getSupabaseAdmin()
        .from("mlo_submissions")
        .update({ status: "rejected" })
        .eq("approve_token", token)
        .eq("status", "pending");

      if (error) {
        return NextResponse.json({
          type: 7,
          data: { content: error.message, components: [] },
        });
      }

      const message = `Rejected ❌ by ${approver}`;
      return NextResponse.json({
        type: 7,
        data: { content: message, components: [] },
      });
    }
  }

  return NextResponse.json({
    type: 4,
    data: { content: "Unhandled interaction", flags: 64 },
  });
}
