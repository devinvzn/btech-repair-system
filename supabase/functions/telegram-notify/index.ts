const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const esc = (value: unknown) =>
  String(value ?? "-")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const money = (value: unknown) =>
  (Number(value) || 0).toLocaleString("en-LK");

type Job = {
  job_no?: string | number;
  customer?: string;
  brand?: string;
  model?: string;
  repair?: string;
  status?: string;
  charge?: number | string;
  payment_status?: string;
  warranty_of?: number | string | null;
};

function buildMessage(type: string, job: Job) {
  const jobNo = esc(job.job_no);
  const customer = esc(job.customer);
  const brand = esc(job.brand);
  const model = esc(job.model);
  const repair = esc(job.repair);
  const status = esc(job.status);
  const charge = money(job.charge);

  if (type === "new_job") {
    return [
      "🔧 <b>New BTech Repair Job</b>",
      "",
      `▪️ <b>Job:</b> #${jobNo}`,
      `▪️ <b>Customer:</b> ${customer}`,
      `▪️ <b>Device:</b> ${brand} ${model}`,
      `▪️ <b>Repair:</b> ${repair}`,
      `▪️ <b>Status:</b> ${status}`,
      `▪️ <b>Charge:</b> Rs. ${charge}`,
    ].join("\n");
  }

  if (type === "status_change") {
    return [
      "🔔 <b>BTech Job Status Update</b>",
      "",
      `▪️ <b>Job:</b> #${jobNo}`,
      `▪️ <b>Customer:</b> ${customer}`,
      `▪️ <b>Device:</b> ${brand} ${model}`,
      `▪️ <b>Status:</b> ${status}`,
      `▪️ <b>Payment:</b> ${esc(job.payment_status)}`,
      `▪️ <b>Charge:</b> Rs. ${charge}`,
    ].join("\n");
  }

  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // The Edge Function platform verifies the user's Supabase JWT before
    // this handler runs (verify_jwt=true, the default).
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const type = body?.type;
    const job = body?.job as Job | undefined;

    if (!job || (type !== "new_job" && type !== "status_change")) {
      return new Response(JSON.stringify({ error: "Invalid notification payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const message = buildMessage(type, job);
    if (!message) {
      return new Response(JSON.stringify({ error: "Unsupported notification type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = Deno.env.get("TG_TOKEN");
    const chatIds = (Deno.env.get("TG_CHAT_IDS") || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!token || chatIds.length === 0) {
      console.error("Telegram secrets are not configured");
      return new Response(JSON.stringify({ error: "Notification service is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = await Promise.all(
      chatIds.map(async (chat_id) => {
        const response = await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id,
              text: message,
              parse_mode: "HTML",
            }),
          },
        );

        if (!response.ok) {
          const detail = await response.text();
          console.error(`Telegram failed for ${chat_id}: ${detail}`);
          return false;
        }

        return true;
      }),
    );

    const sent = results.filter(Boolean).length;

    if (sent === 0) {
      return new Response(JSON.stringify({ error: "Telegram delivery failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("telegram-notify error:", error);
    return new Response(JSON.stringify({ error: "Internal notification error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
