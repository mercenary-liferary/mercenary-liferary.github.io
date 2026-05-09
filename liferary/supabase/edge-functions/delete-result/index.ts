import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server is not configured" }, 500);
  }

  let body: { slug?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const slug = String(body.slug || "").trim();
  const password = String(body.password || "");

  if (!/^\d{8,10}$/.test(slug) || password.length < 4 || password.length > 32) {
    return json({ error: "Invalid request" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false }
  });

  const { data, error } = await supabase
    .from("saju_results")
    .select("slug,password_hash")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) {
    return json({ error: "Lookup failed" }, 500);
  }

  if (!data) {
    return json({ error: "Not found" }, 404);
  }

  const valid = await verifyPassword(password, data.password_hash);
  if (!valid) {
    return json({ error: "Invalid password" }, 403);
  }

  const { error: updateError } = await supabase
    .from("saju_results")
    .update({ deleted_at: new Date().toISOString() })
    .eq("slug", slug)
    .is("deleted_at", null);

  if (updateError) {
    return json({ error: "Delete failed" }, 500);
  }

  return json({ success: true }, 200);
});

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [algorithm, iterationText, saltText, hashText] = String(storedHash || "").split("$");
  if (algorithm !== "pbkdf2-sha256") return false;

  const salt = base64ToBytes(saltText);
  const expected = base64ToBytes(hashText);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations: Number.parseInt(iterationText, 10)
    },
    keyMaterial,
    256
  );
  return constantTimeEqual(new Uint8Array(bits), expected);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index];
  }
  return diff === 0;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
