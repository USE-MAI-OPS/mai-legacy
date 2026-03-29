/**
 * POST /api/telegram/webhook
 *
 * Receives Telegram Bot updates and processes board commands.
 * Register this URL with Telegram via /api/telegram/webhook/register or
 * by calling registerTelegramWebhook() from lib/telegram.ts.
 *
 * Supported commands:
 *   /help                — list available commands
 *   /status or /tasks    — list in-progress tasks from Paperclip
 *   /approvals           — list pending approvals
 *   /approve <id>        — approve a pending Paperclip approval
 *   /reject  <id>        — reject a pending Paperclip approval
 *
 * Security: requests are validated via the X-Telegram-Bot-Api-Secret-Token header
 * when TELEGRAM_WEBHOOK_SECRET is set.
 */

import { NextRequest, NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

// ---------------------------------------------------------------------------
// Paperclip API helpers
// ---------------------------------------------------------------------------

const PAPERCLIP_API_URL = process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3101";
const PAPERCLIP_COMPANY_ID = process.env.PAPERCLIP_COMPANY_ID;

function paperclipHeaders() {
  const key = process.env.PAPERCLIP_BOARD_API_KEY;
  if (!key) throw new Error("PAPERCLIP_BOARD_API_KEY is not configured");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

async function fetchPaperclip(path: string, init?: RequestInit) {
  const res = await fetch(`${PAPERCLIP_API_URL}${path}`, {
    ...init,
    headers: { ...paperclipHeaders(), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paperclip ${path} returned ${res.status}: ${text}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Command handlers
// ---------------------------------------------------------------------------

async function handleHelp(chatId: string) {
  await sendTelegramMessage(
    `*MAI Legacy — Board Bot*\n\n` +
      `/status — list in\\-progress tasks\n` +
      `/approvals — list pending approvals\n` +
      `/approve \\<id\\> — approve by partial ID\n` +
      `/reject \\<id\\> — reject by partial ID\n` +
      `/help — show this message`,
    { chatId, parseMode: "Markdown" }
  );
}

async function handleStatus(chatId: string) {
  if (!PAPERCLIP_COMPANY_ID) {
    await sendTelegramMessage("PAPERCLIP\\_COMPANY\\_ID is not configured.", { chatId });
    return;
  }

  const issues: PaperclipIssue[] = await fetchPaperclip(
    `/api/companies/${PAPERCLIP_COMPANY_ID}/issues?status=in_progress&limit=10`
  );

  if (!issues.length) {
    await sendTelegramMessage("No tasks currently in progress.", { chatId });
    return;
  }

  const lines = issues.map(
    (i) => `• *${i.identifier}* — ${escapeMarkdown(i.title)} _(${i.priority})_`
  );
  await sendTelegramMessage(`*In-progress tasks*\n\n${lines.join("\n")}`, { chatId });
}

async function handleApprovals(chatId: string) {
  if (!PAPERCLIP_COMPANY_ID) {
    await sendTelegramMessage("PAPERCLIP\\_COMPANY\\_ID is not configured.", { chatId });
    return;
  }

  const data: { approvals: PaperclipApproval[] } = await fetchPaperclip(
    `/api/companies/${PAPERCLIP_COMPANY_ID}/approvals?status=pending`
  );
  const approvals = data.approvals ?? (data as unknown as PaperclipApproval[]);

  if (!approvals.length) {
    await sendTelegramMessage("No pending approvals.", { chatId });
    return;
  }

  const lines = approvals.map((a) => {
    const short = a.id.slice(0, 8);
    return `• \`${short}\` — ${escapeMarkdown(a.title ?? a.id)}`;
  });
  await sendTelegramMessage(
    `*Pending approvals*\n\n${lines.join("\n")}\n\nUse /approve \\<id\\> or /reject \\<id\\>`,
    { chatId }
  );
}

async function handleApproveReject(chatId: string, action: "approved" | "rejected", partialId: string) {
  if (!partialId) {
    await sendTelegramMessage(`Usage: /${action === "approved" ? "approve" : "reject"} <approval-id>`, { chatId });
    return;
  }

  if (!PAPERCLIP_COMPANY_ID) {
    await sendTelegramMessage("PAPERCLIP\\_COMPANY\\_ID is not configured.", { chatId });
    return;
  }

  // Search for the approval by partial ID
  const data: { approvals: PaperclipApproval[] } = await fetchPaperclip(
    `/api/companies/${PAPERCLIP_COMPANY_ID}/approvals?status=pending`
  );
  const approvals: PaperclipApproval[] = data.approvals ?? (data as unknown as PaperclipApproval[]);
  const match = approvals.find((a) => a.id.startsWith(partialId) || a.id === partialId);

  if (!match) {
    await sendTelegramMessage(
      `No pending approval found matching \`${escapeMarkdown(partialId)}\`.`,
      { chatId }
    );
    return;
  }

  await fetchPaperclip(`/api/approvals/${match.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: action }),
  });

  const verb = action === "approved" ? "Approved" : "Rejected";
  await sendTelegramMessage(
    `${verb === "Approved" ? "✅" : "❌"} *${verb}*\n\n${escapeMarkdown(match.title ?? match.id)}`,
    { chatId }
  );
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Validate webhook secret when configured
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const incoming = request.headers.get("x-telegram-bot-api-secret-token");
    if (incoming !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = update.message ?? update.edited_message;
  if (!message?.text) {
    // Not a text message — ignore silently (Telegram requires 200)
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  // Only handle slash commands
  if (!text.startsWith("/")) {
    return NextResponse.json({ ok: true });
  }

  const [rawCommand, ...args] = text.split(/\s+/);
  // Strip bot username suffix, e.g. /status@MyBot → /status
  const command = rawCommand.split("@")[0].toLowerCase();

  try {
    if (command === "/help") {
      await handleHelp(chatId);
    } else if (command === "/status" || command === "/tasks") {
      await handleStatus(chatId);
    } else if (command === "/approvals") {
      await handleApprovals(chatId);
    } else if (command === "/approve") {
      await handleApproveReject(chatId, "approved", args[0] ?? "");
    } else if (command === "/reject") {
      await handleApproveReject(chatId, "rejected", args[0] ?? "");
    }
    // Unknown commands are silently ignored
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Best-effort error notification — don't fail the 200 response
    await sendTelegramMessage(`⚠️ Error processing command: ${escapeMarkdown(msg)}`, { chatId }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

// Telegram only does POST; reject everything else cleanly
export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

interface TelegramMessage {
  message_id: number;
  text?: string;
  chat: { id: number; type: string };
  from?: { id: number; first_name: string; username?: string };
}

interface PaperclipIssue {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
}

interface PaperclipApproval {
  id: string;
  title?: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}
