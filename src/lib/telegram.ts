/**
 * Telegram Bot API integration for remote board notifications and approvals.
 *
 * Setup:
 * 1. Create a bot via @BotFather and get TELEGRAM_BOT_TOKEN
 * 2. Start a chat/channel and get the chat ID into TELEGRAM_CHAT_ID
 * 3. Register the webhook: call /api/telegram/webhook/register (POST, admin only)
 *
 * Board commands handled by the webhook route:
 *   /status          — list in-progress tasks from Paperclip
 *   /tasks           — alias for /status
 *   /approve <id>    — approve a Paperclip approval
 *   /reject <id>     — reject a Paperclip approval
 *   /approvals       — list pending approvals
 *   /help            — show available commands
 */

const TELEGRAM_API = "https://api.telegram.org";

function botUrl(method: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  return `${TELEGRAM_API}/bot${token}/${method}`;
}

export function getTelegramChatId(): string {
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID is not configured");
  return chatId;
}

export async function sendTelegramMessage(
  text: string,
  opts: {
    chatId?: string;
    parseMode?: "Markdown" | "HTML";
    disableWebPagePreview?: boolean;
  } = {}
): Promise<void> {
  const chatId = opts.chatId ?? getTelegramChatId();
  const response = await fetch(botUrl("sendMessage"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: opts.parseMode ?? "Markdown",
      disable_web_page_preview: opts.disableWebPagePreview ?? true,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed (${response.status}): ${body}`);
  }
}

export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<void> {
  await fetch(botUrl("answerCallbackQuery"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

/**
 * Register the Telegram webhook with Telegram's servers.
 * Call this once after deployment (or whenever APP_URL changes).
 */
export async function registerTelegramWebhook(): Promise<{ ok: boolean; description?: string }> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) throw new Error("NEXT_PUBLIC_APP_URL is not configured");

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const webhookUrl = `${appUrl}/api/telegram/webhook`;

  const response = await fetch(botUrl("setWebhook"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: secret ?? undefined,
      allowed_updates: ["message", "callback_query"],
    }),
  });

  return response.json();
}

// ---------------------------------------------------------------------------
// Notification helpers — call these from Paperclip heartbeats / cron jobs
// ---------------------------------------------------------------------------

export async function notifyTaskCompleted(opts: {
  identifier: string;
  title: string;
  agentName: string;
}): Promise<void> {
  const { identifier, title, agentName } = opts;
  await sendTelegramMessage(
    `✅ *Task completed*\n\n[${identifier}] ${escapeMarkdown(title)}\n_by ${escapeMarkdown(agentName)}_`
  );
}

export async function notifyApprovalRequired(opts: {
  approvalId: string;
  title: string;
  requestedBy: string;
  appUrl?: string;
}): Promise<void> {
  const { approvalId, title, requestedBy, appUrl } = opts;
  const base = appUrl ?? process.env.NEXT_PUBLIC_APP_URL ?? "";
  const short = approvalId.slice(0, 8);

  await sendTelegramMessage(
    `🔔 *Approval required*\n\n${escapeMarkdown(title)}\n_requested by ${escapeMarkdown(requestedBy)}_\n\nApproval ID: \`${short}\`\n\nReply with:\n/approve ${short}\n/reject ${short}` +
      (base ? `\n\n[View in dashboard](${base}/approvals/${approvalId})` : "")
  );
}

export async function notifyTaskBlocked(opts: {
  identifier: string;
  title: string;
  reason: string;
  agentName: string;
}): Promise<void> {
  const { identifier, title, reason, agentName } = opts;
  await sendTelegramMessage(
    `🚧 *Task blocked*\n\n[${identifier}] ${escapeMarkdown(title)}\n_reported by ${escapeMarkdown(agentName)}_\n\n${escapeMarkdown(reason)}`
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Escape Markdown v1 special characters so user content renders safely. */
function escapeMarkdown(text: string): string {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}
