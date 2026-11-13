// Database webhook: reports UPDATE. Configure x-webhook-secret and disable gateway
// JWT verification for this function only; this handler authenticates every call.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SignJWT, importPKCS8 } from "https://esm.sh/jose@5.9.6";
const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
Deno.serve(async (req) => {
  const secret = Deno.env.get("REPORT_WEBHOOK_SECRET");
  if (!secret || req.headers.get("x-webhook-secret") !== secret)
    return response({ error: "Unauthorized" }, 401);
  if (req.method !== "POST")
    return response({ error: "Method not allowed" }, 405);
  try {
    const payload = await req.json();
    if (
      payload.type !== "UPDATE" ||
      payload.table !== "reports" ||
      payload.schema !== "public" ||
      payload.record?.status !== "approved" ||
      payload.old_record?.status === "approved"
    )
      return response({ skipped: true });
    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: report, error } = await db
      .from("reports")
      .select("id,city_id,status,expires_at,cities(name)")
      .eq("id", payload.record.id)
      .single();
    if (error) throw error;
    if (
      report.status !== "approved" ||
      Date.parse(report.expires_at) <= Date.now()
    )
      return response({ skipped: true });
    const account = JSON.parse(
      Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || "{}",
    );
    if (!account.private_key || !account.client_email || !account.project_id)
      throw new Error("Firebase service account not configured");
    const key = await importPKCS8(account.private_key, "RS256");
    const jwt = await new SignJWT({
      scope: "https://www.googleapis.com/auth/firebase.messaging",
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(account.client_email)
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(key);
    const oauth = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });
    const credentials = await oauth.json();
    if (!oauth.ok) throw new Error("Firebase authentication failed");
    const ttl = Math.max(
      0,
      Math.min(
        14400,
        Math.floor((Date.parse(report.expires_at) - Date.now()) / 1000),
      ),
    );
    const sent = await fetch(
      `https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            topic: `city_${report.city_id}`,
            notification: {
              title: "Nuovo avviso nella tua zona",
              body: `Segnalazione verificata a ${(report.cities as any)?.name || "la tua città"}. Apri PickAlert per i dettagli.`,
            },
            data: { report_id: report.id, city_id: report.city_id },
            android: {
              ttl: `${ttl}s`,
              notification: { channel_id: "pickalert_alerts", tag: report.id },
            },
          },
        }),
      },
    );
    if (!sent.ok) throw new Error("FCM delivery request failed");
    return response({ sent: true });
  } catch (error) {
    console.error(
      "notify-report failed",
      error instanceof Error ? error.message : "unknown",
    );
    return response({ error: "Notification delivery failed" }, 500);
  }
});
