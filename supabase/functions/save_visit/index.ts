import { verifyOfficeToken } from "../_shared/auth.ts";
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { normalizeDateIso } from "../_shared/normalize.ts";
import { computePatientKey, normalizeKeyPart } from "../_shared/patientKey.ts";
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

  let formData: Record<string, unknown>;
  try {
    formData = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON" }, 400);
  }

  const office = String(formData.office ?? "");
  const patid = String(formData.patid ?? "");
  const pat = String(formData.pat ?? "");
  const subid = String(formData.subid ?? "");
  const dateRaw = String(formData.date ?? "");
  const patdobRaw = String(formData.patdob ?? "");

  if (!normalizeKeyPart(office) || !normalizeKeyPart(patid)) {
    return jsonResponse({ error: "Office name and Patient ID are required to save" }, 400);
  }

  const dateOfService = normalizeDateIso(dateRaw);
  if (!dateOfService) {
    return jsonResponse({ error: "Valid date of service required" }, 400);
  }

  const patientKey = await computePatientKey(office, patid);
  const patdob = patdobRaw ? normalizeDateIso(patdobRaw) : null;

  const supabase = adminClient();

  const { data: patientRow, error: patientError } = await supabase
    .from("patients")
    .upsert(
      {
        patient_key: patientKey,
        patid: patid.trim(),
        pat: pat.trim(),
        patdob,
        subid: subid.trim(),
      },
      { onConflict: "patient_key" },
    )
    .select("id")
    .single();

  if (patientError || !patientRow) {
    return jsonResponse({ error: patientError?.message ?? "Could not save patient" }, 500);
  }

  const { data: visitRow, error: visitError } = await supabase
    .from("voi_visits")
    .upsert(
      {
        patient_id: patientRow.id,
        date_of_service: dateOfService,
        form_data: formData,
      },
      { onConflict: "patient_id,date_of_service" },
    )
    .select("id")
    .single();

  if (visitError || !visitRow) {
    return jsonResponse({ error: visitError?.message ?? "Could not save visit" }, 500);
  }

  return jsonResponse({
    patient_id: patientRow.id,
    visit_id: visitRow.id,
    patient_key: patientKey,
  });
});
