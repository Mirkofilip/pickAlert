// Optional legacy photo cleanup. New reports never accept photos.
// Protect using x-cleanup-secret; configure CLEANUP_SECRET in Supabase secrets.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req) => {
  const secret = Deno.env.get("CLEANUP_SECRET");
  if (!secret || req.headers.get("x-cleanup-secret") !== secret)
    return new Response("Unauthorized", { status: 401 });
  const db = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  try {
    // Snapshot candidate names before deleting, so pagination is not shifted by deletion.
    const files = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await db.storage
        .from("report-photos")
        .list("", {
          limit: 1000,
          offset,
          sortBy: { column: "name", order: "asc" },
        });
      if (error) throw error;
      files.push(
        ...(data ?? []).filter(
          (f) => f.id && Date.parse(f.created_at) < Date.now() - 86400000,
        ),
      );
      if ((data?.length ?? 0) < 1000) break;
    }
    let removed = 0;
    for (const file of files) {
      const { data: referenced, error } = await db
        .from("reports")
        .select("id")
        .like("photo_url", `%/report-photos/${file.name}`)
        .gt("expires_at", new Date().toISOString())
        .limit(1);
      if (error) throw error;
      if (referenced?.length) continue;
      const { error: removeError } = await db.storage
        .from("report-photos")
        .remove([file.name]);
      if (removeError) throw removeError;
      removed++;
    }
    return Response.json({ deleted_photos: removed });
  } catch {
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }
});
