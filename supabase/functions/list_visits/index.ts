import { verifyOfficeToken } from "../_shared/auth.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
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

  let body: { patient_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const patientId = String(body.patient_id ?? "").trim();
  if (!patientId) return jsonResponse({ error: "patient_id required" }, 400);

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("voi_visits")
    .select("id, date_of_service, updated_at")
    .eq("patient_id", patientId)
    .order("date_of_service", { ascending: false });

  if (error) return jsonResponse({ error: error.message }, 500);

  const visits = (data ?? []).map((row) => ({
    visit_id: row.id,
    date_of_service: row.date_of_service,
    updated_at: row.updated_at,
  }));

  return jsonResponse({ visits });
});
