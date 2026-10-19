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

  let body: { visit_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const visitId = String(body.visit_id ?? "").trim();
  if (!visitId) return jsonResponse({ error: "visit_id required" }, 400);

  const supabase = adminClient();
  const { data, error } = await supabase
    .from("voi_visits")
    .select("id, patient_id, date_of_service, form_data, updated_at")
    .eq("id", visitId)
    .maybeSingle();

  if (error) return jsonResponse({ error: error.message }, 500);
  if (!data) return jsonResponse({ error: "Visit not found" }, 404);

  return jsonResponse({
    visit_id: data.id,
    patient_id: data.patient_id,
    date_of_service: data.date_of_service,
    form_data: data.form_data,
    updated_at: data.updated_at,
  });
});
