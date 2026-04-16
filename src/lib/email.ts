import { Resend } from "resend";

let _resend: Resend | null = null;

/** Lazily initialize Resend so builds succeed without RESEND_API_KEY at compile time */
function getResend(): Resend {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendContactEmail(opts: {
  fromName: string;
  fromEmail: string;
  message: string;
}) {
  const { fromName, fromEmail, message } = opts;

  const escape = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#18181b;padding:20px 32px;"><h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">New contact form submission</h1></td></tr>
        <tr><td style="padding:24px 32px;">
          <p style="margin:0 0 4px;font-size:13px;color:#71717a;">From</p>
          <p style="margin:0 0 16px;font-size:15px;color:#18181b;"><strong>${escape(fromName)}</strong> &lt;${escape(fromEmail)}&gt;</p>
          <p style="margin:0 0 4px;font-size:13px;color:#71717a;">Message</p>
          <div style="margin:0;font-size:14px;color:#18181b;line-height:1.6;white-space:pre-wrap;">${escape(message)}</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const result = await getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to: "support@usemai.com",
    replyTo: fromEmail,
    subject: `Contact form: ${fromName}`,
    html,
  });

  if (result.error) {
    console.error("Resend contact email error:", JSON.stringify(result.error));
  }

  return result;
}

export async function sendInviteEmail(opts: {
  to: string;
  inviteUrl: string;
  familyName: string;
  inviterName: string;
}) {
  const { to, inviteUrl, familyName, inviterName } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">You're Invited!</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                <strong style="color:#18181b;">${inviterName}</strong> has invited you to join
                <strong style="color:#18181b;">${familyName}</strong> on MAI Legacy — a place to preserve
                your family's stories, skills, and wisdom for generations.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${inviteUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Accept Invite
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.5;">
                This invite expires in 7 days. If you don't have an account yet,
                you'll be prompted to create one first.
              </p>
              <!-- Link fallback -->
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;word-break:break-all;">
                Can't click the button? Copy this link:<br/>
                <a href="${inviteUrl}" style="color:#3b82f6;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const result = await getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: `You're invited to join ${familyName} on MAI Legacy`,
    html,
  });

  if (result.error) {
    console.error("Resend invite email error:", JSON.stringify(result.error));
  }

  return result;
}

export async function sendVerificationCodeEmail(opts: {
  to: string;
  code: string;
}) {
  const { to, code } = opts;

  const digits = code.split("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Verify Your Email</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                Enter this code to verify your email address and complete your account setup.
              </p>
              <!-- Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <table cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;border:2px solid #e4e4e7;border-radius:12px;">
                      <tr>
                        ${digits.map((d) => `<td style="padding:14px 12px;text-align:center;"><span style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:700;color:#18181b;">${d}</span></td>`).join("")}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.5;">
                This code expires in <strong style="color:#18181b;">10 minutes</strong>.
              </p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.5;">
                If you didn't create an account on MAI Legacy, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const result = await getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: "Your MAI Legacy verification code",
    html,
  });

  if (result.error) {
    console.error("Resend verification email error:", JSON.stringify(result.error));
  }

  return result;
}

export interface DigestEntry {
  title: string;
  type: string;
  authorName: string;
}

export interface DigestDiscovery {
  title: string;
  body: string;
}

export interface DigestEvent {
  title: string;
  eventDate: string;
}

export async function sendWeeklyDigest(opts: {
  to: string;
  memberName: string;
  familyName: string;
  entries: DigestEntry[];
  discoveries: DigestDiscovery[];
  events: DigestEvent[];
  unsubscribeUrl: string;
  appUrl: string;
}) {
  const { to, memberName, familyName, entries, discoveries, events, unsubscribeUrl, appUrl } = opts;

  const entryTypeLabel: Record<string, string> = {
    story: "Story",
    skill: "Skill",
    recipe: "Recipe",
    lesson: "Lesson",
    connection: "Connection",
    general: "Post",
  };

  const entriesHtml = entries.length
    ? entries
        .map(
          (e) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
              <span style="display:inline-block;background-color:#f4f4f5;color:#52525b;font-size:11px;font-weight:600;padding:2px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:0.05em;">${entryTypeLabel[e.type] ?? "Post"}</span>
              <p style="margin:6px 0 2px;font-size:14px;font-weight:600;color:#18181b;">${e.title}</p>
              <p style="margin:0;font-size:12px;color:#71717a;">by ${e.authorName}</p>
            </td>
          </tr>`
        )
        .join("")
    : "";

  const discoveriesHtml = discoveries.length
    ? `
      <tr><td style="padding:24px 0 8px;"><h3 style="margin:0;font-size:16px;font-weight:700;color:#18181b;">Griot Discoveries</h3></td></tr>
      ${discoveries
        .map(
          (d) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#18181b;">${d.title}</p>
              <p style="margin:0;font-size:13px;color:#52525b;line-height:1.5;">${d.body.slice(0, 120)}${d.body.length > 120 ? "…" : ""}</p>
            </td>
          </tr>`
        )
        .join("")}`
    : "";

  const eventsHtml = events.length
    ? `
      <tr><td style="padding:24px 0 8px;"><h3 style="margin:0;font-size:16px;font-weight:700;color:#18181b;">Upcoming Events</h3></td></tr>
      ${events
        .map(
          (ev) => `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#18181b;">${ev.title}</p>
              <p style="margin:0;font-size:12px;color:#71717a;">${ev.eventDate}</p>
            </td>
          </tr>`
        )
        .join("")}`
    : "";

  const newEntriesSection = entries.length
    ? `
      <tr><td style="padding:0 0 8px;"><h3 style="margin:0;font-size:16px;font-weight:700;color:#18181b;">New This Week</h3></td></tr>
      ${entriesHtml}`
    : "";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
              <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">Weekly Family Digest</p>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding:32px 32px 16px;">
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#18181b;">Hi ${memberName},</h2>
              <p style="margin:0;font-size:15px;color:#52525b;line-height:1.6;">
                Here's what happened in <strong style="color:#18181b;">${familyName}</strong> this week.
              </p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:0 32px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                ${newEntriesSection}
                ${discoveriesHtml}
                ${eventsHtml}
              </table>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;text-align:center;">
              <a href="${appUrl}" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                Visit Your Family
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0 0 6px;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">
                <a href="${unsubscribeUrl}" style="color:#71717a;">Unsubscribe from weekly digest</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: `Your weekly digest from ${familyName}`,
    html,
  });
}

// ---------------------------------------------------------------------------
// Drip onboarding sequence
// ---------------------------------------------------------------------------

export async function sendWaitlistConfirmation(opts: {
  to: string;
  name?: string;
  appUrl: string;
}) {
  const { to, name, appUrl } = opts;
  const greeting = name ? `Hi ${name}` : "Hi there";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#18181b;">${greeting} — you're on the list!</h2>
              <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.7;">
                Thank you for joining the MAI Legacy waitlist. We're building the private family archive
                your family deserves — and you'll be among the first to experience it.
              </p>
              <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.7;">
                We'll reach out as soon as your access is ready. In the meantime, feel free to
                explore our interactive demo to see what you're in for.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 24px;">
                    <a href="${appUrl}/demo" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Explore the Demo
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:13px;color:#71717a;line-height:1.5;">
                Excited to preserve what matters most,<br/>
                <strong style="color:#18181b;">The MAI Legacy Team</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: "You're on the MAI Legacy list!",
    html,
  });
}

export async function sendDripWelcome(opts: {
  to: string;
  displayName: string;
  appUrl: string;
}) {
  const { to, displayName, appUrl } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
              <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">Your family's knowledge base is ready</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Welcome, ${displayName}!</h2>
              <p style="margin:0 0 20px;font-size:15px;color:#52525b;line-height:1.6;">
                You've just created your family's private knowledge base. Now it's time to
                start filling it with the stories, skills, and wisdom that matter most.
              </p>
              <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#18181b;">Get started in 3 steps:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                    <p style="margin:0;font-size:14px;color:#18181b;"><strong>1. Add your first memory</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:#71717a;line-height:1.5;">Record a family story, a recipe passed down through generations, or a skill worth teaching.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f4f4f5;">
                    <p style="margin:0;font-size:14px;color:#18181b;"><strong>2. Invite a family member</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:#71717a;line-height:1.5;">The best family archives are built together. Invite a parent, sibling, or grandparent to contribute.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <p style="margin:0;font-size:14px;color:#18181b;"><strong>3. Ask the Griot</strong></p>
                    <p style="margin:4px 0 0;font-size:13px;color:#71717a;line-height:1.5;">Your AI Griot learns from every memory. Once you have a few, ask it anything about your family's documented knowledge.</p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0;">
                    <a href="${appUrl}/dashboard" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Start Your Legacy
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: "Your family's knowledge base is ready — here's how to start",
    html,
  });
}

export async function sendDripDay3(opts: {
  to: string;
  displayName: string;
  appUrl: string;
}) {
  const { to, displayName, appUrl } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">Hi ${displayName} — two features worth knowing</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                As your family's archive grows, these two features become more powerful with every entry you add.
              </p>
              <!-- Feature 1: Memories -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;background-color:#f9f9f9;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#18181b;">Family Timeline &amp; Search</p>
                    <p style="margin:0;font-size:14px;color:#52525b;line-height:1.5;">
                      Every entry you add — stories, recipes, skills, lessons — is automatically indexed.
                      Search across your entire family history in seconds. Find that recipe your grandmother
                      made, or every story about a specific family member.
                    </p>
                  </td>
                </tr>
              </table>
              <!-- Feature 2: Griot -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f9f9f9;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#18181b;">Ask the Griot</p>
                    <p style="margin:0;font-size:14px;color:#52525b;line-height:1.5;">
                      Your AI Griot is trained only on <em>your</em> family's memories — nothing else.
                      Ask it "What did grandma teach about cooking?" or "What skills has our family passed down?"
                      and it answers from your actual archive. Private, personal, and powerful.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.5;">
                The more entries you and your family contribute, the smarter and richer your archive becomes.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Add an Entry Now
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: "Your family archive + AI Griot: how they work together",
    html,
  });
}

export async function sendDripDay7(opts: {
  to: string;
  displayName: string;
  appUrl: string;
}) {
  const { to, displayName, appUrl } = opts;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#18181b;padding:24px 32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">MAI Legacy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#18181b;">One week in, ${displayName}</h2>
              <p style="margin:0 0 24px;font-size:15px;color:#52525b;line-height:1.6;">
                Families using MAI Legacy tell us the same thing: <em>"I wish we had started this sooner."</em>
                Here's what they're preserving before it's too late.
              </p>
              <!-- Testimonials -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-left:3px solid #18181b;padding-left:0;">
                <tr>
                  <td style="padding:0 0 0 16px;">
                    <p style="margin:0 0 4px;font-size:14px;color:#18181b;line-height:1.5;font-style:italic;">
                      "My dad passed last year. I'm so grateful I had him record his stories in MAI Legacy. My kids can still ask the Griot questions about him."
                    </p>
                    <p style="margin:0;font-size:12px;color:#71717a;">— Early MAI Legacy family</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-left:3px solid #18181b;padding-left:0;">
                <tr>
                  <td style="padding:0 0 0 16px;">
                    <p style="margin:0 0 4px;font-size:14px;color:#18181b;line-height:1.5;font-style:italic;">
                      "We recovered three generations of recipes that were almost lost. My grandmother dictated them all; now the whole family has access."
                    </p>
                    <p style="margin:0;font-size:12px;color:#71717a;">— Early MAI Legacy family</p>
                  </td>
                </tr>
              </table>
              <!-- Upgrade nudge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background-color:#f4f4f5;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;font-size:15px;font-weight:700;color:#18181b;">Ready to grow your archive?</p>
                    <p style="margin:0 0 12px;font-size:14px;color:#52525b;line-height:1.5;">
                      Invite more family members, add audio recordings, and unlock unlimited entries
                      as your family's story grows. Our paid plans are built for families serious
                      about preservation.
                    </p>
                    <a href="${appUrl}/settings/billing" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:10px 24px;border-radius:8px;">
                      See Plans
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.5;">
                Not ready to upgrade? Keep going on the free plan — there's no rush.
                The most important thing is that you keep adding entries while you still can.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${appUrl}/dashboard" style="display:inline-block;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 32px;border-radius:8px;">
                      Continue Building Your Archive
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #e4e4e7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#a1a1aa;">
                MAI Legacy — Preserve what matters.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return getResend().emails.send({
    from: "MAI Legacy <noreply@mailegacy.com>",
    to,
    subject: "One week of family history preserved — what's next?",
    html,
  });
}
