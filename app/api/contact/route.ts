export const runtime = "nodejs";

import { NextResponse } from "next/server";

const MAX_MESSAGE = 1000;

type ContactPayload = {
  name?: string;
  email?: string;
  message?: string;
};

async function sendDiscordWebhook(payload: ContactPayload) {
  const webhook = process.env.DISCORD_WEBHOOK_URL;
  if (!webhook) return false;

  const content = payload.message || "";
  const discordPayload = {
    content: "New contact message",
    embeds: [
      {
        title: payload.name || "Contact",
        fields: [
          { name: "Email", value: payload.email || "—", inline: true },
          { name: "Message", value: content || "—", inline: false },
        ],
      },
    ],
  };

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(discordPayload),
  });

  return res.ok;
}

async function sendResendEmail(payload: ContactPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM;
  if (!apiKey || !to || !from) return false;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `MLOMesh contact from ${payload.name || "Someone"}`,
      text: `Name: ${payload.name || "—"}\nEmail: ${
        payload.email || "—"
      }\n\n${payload.message || ""}`,
    }),
  });

  return res.ok;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ContactPayload;
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const safeMessage =
    message.length > MAX_MESSAGE ? message.slice(0, MAX_MESSAGE) : message;

  const payload = { name, email, message: safeMessage };

  const [discordOk, emailOk] = await Promise.all([
    sendDiscordWebhook(payload),
    sendResendEmail(payload),
  ]);

  if (!discordOk && !emailOk) {
    return NextResponse.json({ error: "Delivery failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, discordOk, emailOk });
}
