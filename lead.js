/* Turns a form submission into an email, using Resend.
 *
 * Why this exists instead of posting to Resend from the browser:
 * Resend needs a secret API key. Anything in browser JavaScript is
 * public — view source and it's yours. A key sitting in a static page
 * is somebody else's spam operation running on this domain. So the
 * browser posts here, and only this file, running on Netlify's server,
 * ever sees the key.
 *
 * Environment variables to set in Netlify (Site settings → Environment):
 *   RESEND_API_KEY  the key from resend.com
 *   LEAD_TO         where enquiries land — the painter's own address
 *   LEAD_FROM       optional. Must be on a domain verified in Resend.
 *                   Defaults to Resend's test sender, which can ONLY
 *                   deliver to the Resend account owner's own address.
 */

const esc = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  let d;
  try {
    d = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 });
  }

  /* --- spam, layer one: the honeypot ---
     A field a human never sees and never fills. Bots fill every input
     they find. Anything with this filled is discarded — and we return
     200, not an error, so the bot has no signal to adapt to. */
  if (d._gotcha || d.website) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  /* --- spam, layer two: the clock ---
     The page stamps when the form was rendered. A real person needs
     more than three seconds to type their name and phone number. */
  const elapsed = Date.now() - Number(d.t || 0);
  if (d.t && elapsed < 3000) {
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }

  if (!String(d.first_name || '').trim() || !String(d.phone || '').trim()) {
    return new Response(JSON.stringify({ error: 'Missing name or phone' }), { status: 400 });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_TO;
  const from = process.env.LEAD_FROM || 'onboarding@resend.dev';

  /* Fail loudly in the log rather than quietly to the visitor. If this
     is misconfigured the person on the phone should hear about it. */
  if (!key || !to) {
    console.error('lead: RESEND_API_KEY or LEAD_TO is not set — nothing was sent');
    return new Response(JSON.stringify({ error: 'Not configured' }), { status: 500 });
  }

  const rows = [
    ['Name', `${d.first_name || ''} ${d.last_name || ''}`.trim()],
    ['Phone', d.phone],
    ['Email', d.email],
    ['Address', d.address],
    ['Job', d.job_type],
    ['Timing', d.timing],
    ['From page', d.source_page],
  ].filter(([, v]) => String(v || '').trim());

  const html =
    `<h2 style="font:600 18px system-ui;margin:0 0 14px">New estimate request</h2>` +
    `<table style="font:14px/1.5 system-ui;border-collapse:collapse">` +
    rows.map(([k, v]) =>
      `<tr><td style="padding:4px 14px 4px 0;color:#666">${esc(k)}</td>` +
      `<td style="padding:4px 0"><b>${esc(v)}</b></td></tr>`).join('') +
    `</table>` +
    (String(d.notes || '').trim()
      ? `<p style="font:14px/1.6 system-ui;margin:16px 0 0;white-space:pre-wrap">` +
        `<b>Notes</b><br>${esc(d.notes)}</p>`
      : '');

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [to],
        /* Subject carries the name AND the phone number, so the whole
           lead is readable from a phone's lock screen without opening
           anything — which is how a contractor on a ladder reads email. */
        subject: `Prospect — ${`${d.first_name || ''} ${d.last_name || ''}`.trim()}`
                 + (d.phone ? ` · ${d.phone}` : '')
                 + (d.job_type ? ` · ${d.job_type}` : ''),
        html,
        /* So he can just hit reply and be talking to the customer. */
        ...(String(d.email || '').trim() ? { reply_to: d.email } : {}),
      }),
    });

    if (!res.ok) {
      console.error('lead: Resend returned', res.status, await res.text());
      return new Response(JSON.stringify({ error: 'Send failed' }), { status: 502 });
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error('lead: request to Resend threw', err);
    return new Response(JSON.stringify({ error: 'Send failed' }), { status: 502 });
  }
};
