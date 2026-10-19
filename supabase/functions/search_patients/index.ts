import { verifyOfficeToken } from "../_shared/auth.ts";
import { corsHeaders, jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { normalizeDateIso, normalizeSearchName, normalizeSubid } from "../_shared/normalize.ts";
import { adminClient } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  const jwtSecret = Deno.env.get("OFFICE_JWT_SECRET") ?? Deno.env.get("OFFICE_PIN");
  if (!jwtSecret || !(await verifyOfficeToken(jwtSecret, req.headers.get("Authorization")))) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: { pat?: string; patdob?: string; subid?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const subid = normalizeSubid(String(body.subid ?? ""));
  const pat = normalizeSearchName(String(body.pat ?? ""));
  const patdob = normalizeDateIso(String(body.patdob ?? ""));

  const supabase = adminClient();

  if (subid) {
    const { data, error } = await supabase
      .from("patients")
      .select("id, pat, patdob, patid, subid, updated_at")
      .ilike("subid", subid);

    if (error) return jsonResponse({ error: error.message }, 500);
    const patients = await attachLastVisit(supabase, data ?? []);
    return jsonResponse({ patients });
  }

  if (pat && patdob) {
    const { data, error } = await supabase
      .from("patients")
      .select("id, pat, patdob, patid, subid, updated_at")
      .eq("patdob", patdob);

    if (error) return jsonResponse({ error: error.message }, 500);

    const filtered = (data ?? []).filter((row) => normalizeSearchName(row.pat ?? "") === pat);
    const patients = await attachLastVisit(supabase, filtered);
    return jsonResponse({ patients });
  }

  return jsonResponse({ error: "Provide subid or both pat and patdob" }, 400);
});

async function attachLastVisit(
  supabase: ReturnType<typeof adminClient>,
  rows: { id: string; pat: string; patdob: string | null; patid: string; subid: string; updated_at: string }[],
) {
  const out = [];
  for (const row of rows) {
    const { data: visits } = await supabase
      .from("voi_visits")
      .select("date_of_service")
      .eq("patient_id", row.id)
      .order("date_of_service", { ascending: false })
      .limit(1);
    out.push({
      id: row.id,
      pat: row.pat,
      patdob: row.patdob,
      patid: row.patid,
      subid: row.subid,
      last_visit_date: visits?.[0]?.date_of_service ?? null,
    });
  }
  return out;
}
