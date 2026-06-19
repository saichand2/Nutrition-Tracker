// Keeps the Supabase project active on the free tier (which pauses after ~1 week of inactivity).
// Runs every 3 days via cron (configured in supabase/config.toml).
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.from("log_entries").select("id").limit(1);

  return new Response(
    JSON.stringify({ ok: !error, error: error?.message ?? null }),
    { status: error ? 500 : 200, headers: { "Content-Type": "application/json" } }
  );
});
