// Transactional email through Resend's REST API (no SDK needed, like lib/razorpay.ts).
//
// Provision it with:  vercel integration add resend/resend-email --yes
// That sets RESEND_API_KEY. Also set EMAIL_FROM to an address on a domain you've verified
// with Resend, otherwise Resend refuses the send.
export async function sendEmail({ to, subject, text, html }: { to: string; subject: string; text: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    // Loud on purpose: a silent failure here means a locked-out user waiting for an email
    // that is never coming. In development the link is printed so the flow still works.
    console.error("[email] RESEND_API_KEY or EMAIL_FROM is not set — not sending:", { to, subject });
    if (process.env.NODE_ENV !== "production") console.info("[email] would have sent:\n", text);
    throw new Error("Email isn't configured on this server.");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html }),
  });
  if (!res.ok) throw new Error(`Resend send failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as { id: string };
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Plain, legible, and the same words in both halves so a text-only client loses nothing.
export function resetPasswordEmail(name: string, url: string) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return {
    subject: "Reset your DeckAI password",
    text: `${greeting}

Someone asked to reset the password for your DeckAI account. Open this link to choose a new one:

${url}

The link works once and expires in an hour. If this wasn't you, ignore this email — your password hasn't changed.

— DeckAI`,
    html: `<div style="font-family:system-ui,sans-serif;font-size:16px;line-height:1.6;color:#1f2328;max-width:34em">
<p>${esc(greeting)}</p>
<p>Someone asked to reset the password for your DeckAI account. Choose a new one here:</p>
<p><a href="${esc(url)}" style="display:inline-block;background:#e8590c;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset my password</a></p>
<p style="color:#4b5563;font-size:14px">The link works once and expires in an hour. If this wasn't you, ignore this email — your password hasn't changed.</p>
<p style="color:#4b5563;font-size:14px">— DeckAI</p>
</div>`,
  };
}
