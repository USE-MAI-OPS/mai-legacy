import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

  return resend.emails.send({
    from: "MAI Legacy <noreply@usemai.com>",
    to,
    subject: `You're invited to join ${familyName} on MAI Legacy`,
    html,
  });
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

  return resend.emails.send({
    from: "MAI Legacy <noreply@usemai.com>",
    to,
    subject: `Your weekly digest from ${familyName}`,
    html,
  });
}
