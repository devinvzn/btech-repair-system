// Daily alert script (runs from GitHub Actions)
// All secrets come from environment variables; nothing is hardcoded here.

const { SUPA_URL, SUPA_SERVICE_KEY, TG_TOKEN, TG_CHAT_IDS } = process.env;

if (!SUPA_URL || !SUPA_SERVICE_KEY || !TG_TOKEN || !TG_CHAT_IDS) {
  console.error('Missing required secrets (SUPA_URL, SUPA_SERVICE_KEY, TG_TOKEN, TG_CHAT_IDS)');
  process.exit(1);
}

const chatIds = TG_CHAT_IDS.split(',').map((s) => s.trim()).filter(Boolean);
const esc = (s) => String(s ?? '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const daysSince = (d) => Math.floor((Date.now() - new Date(d).getTime()) / 86400000);

async function query(path) {
  const res = await fetch(`${SUPA_URL}/rest/v1/${path}`, {
    headers: { apikey: SUPA_SERVICE_KEY, Authorization: `Bearer ${SUPA_SERVICE_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`);
  return res.json();
}

async function send(text) {
  for (const chat_id of chatIds) {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id, text, parse_mode: 'HTML' }),
    });
    if (!r.ok) console.error(`Telegram failed for ${chat_id}:`, await r.text());
  }
}

(async () => {
  const pending = await query('jobs?select=*&status=eq.Pending');
  const delayed = pending
    .filter((j) => j.send_date && daysSince(j.send_date) > 3)
    .sort((a, b) => daysSince(b.send_date) - daysSince(a.send_date));

  // Only jobs where payment is actually owed: Done + Not Paid + charge > 0 + not warranty
  // (Can't Repair = returned, no payment. Warranty = free.)
  const unpaid = (await query('jobs?select=*&status=eq.Done&payment_status=eq.Not%20Paid'))
    .filter((j) => j.warranty_of == null && (Number(j.charge) || 0) > 0);

  const parts = [];

  if (delayed.length) {
    let t = `⚠️ <b>Morning reminder! ${delayed.length} laptop(s) are more than 3 days delayed.</b>\n\n`;
    delayed.forEach((j) => {
      t += `▪️ <b>#${esc(j.job_no)}</b>: ${esc(j.customer)} <i>(${daysSince(j.send_date)} Days Delayed)</i>\n`;
    });
    t += `\nPlease follow up with BTech today.`;
    parts.push(t);
  }

  if (unpaid.length) {
    const total = unpaid.reduce((s, j) => s + (Number(j.charge) || 0), 0);
    let t = `💰 <b>${unpaid.length} job(s) with pending payment</b> (Rs. ${total.toLocaleString()})\n\n`;
    unpaid.slice(0, 15).forEach((j) => {
      t += `▪️ <b>#${esc(j.job_no)}</b>: ${esc(j.customer)} – Rs. ${(Number(j.charge) || 0).toLocaleString()}\n`;
    });
    if (unpaid.length > 15) t += `\n...and ${unpaid.length - 15} more`;
    parts.push(t);
  }

  if (!parts.length) {
    console.log('Nothing to report today.');
    return;
  }

  for (const p of parts) await send(p);
  console.log(`Sent ${parts.length} alert message(s).`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
