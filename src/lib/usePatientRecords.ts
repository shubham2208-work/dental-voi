import { useCallback, useState } from "react";
import type { UseFormReset } from "react-hook-form";
import {
  ApiError,
  getVisit,
  hasOfficeSession,
  listVisits,
  saveVisit,
  searchPatients,
} from "./api/client";
import type { PatientSummary, VisitSummary } from "./api/types";
import { canDerivePatientKey } from "./patientKey";
import type { VoiFormValues } from "../types";

export function usePatientRecords({
  reset,
  getValues,
  onStatus,
}: {
  reset: UseFormReset<VoiFormValues>;
  getValues: () => VoiFormValues;
  onStatus: (message: string) => void;
}) {
  const [pinOpen, setPinOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dosOpen, setDosOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [patientChoices, setPatientChoices] = useState<PatientSummary[] | null>(null);
  const [pendingVisits, setPendingVisits] = useState<VisitSummary[]>([]);
  const [pendingPatientLabel, setPendingPatientLabel] = useState("");
  const [loadedVisitId, setLoadedVisitId] = useState<string | null>(null);
  const [loadedPatientId, setLoadedPatientId] = useState<string | null>(null);

  const ensureSession = useCallback((): boolean => {
    if (hasOfficeSession()) return true;
    setPinOpen(true);
    return false;
  }, []);

  const loadVisit = useCallback(
    async (visitId: string) => {
      setBusy(true);
      try {
        const result = await getVisit(visitId);
        reset(result.form_data, { keepFieldsRef: true });
        setLoadedVisitId(result.visit_id);
        setLoadedPatientId(result.patient_id);
        setDosOpen(false);
        setSearchOpen(false);
        onStatus(`Loaded visit for ${result.date_of_service}.`);
      } catch (err) {
        onStatus(err instanceof ApiError ? err.message : "Could not load visit");
      } finally {
        setBusy(false);
      }
    },
    [onStatus, reset],
  );

  const openVisitsForPatient = useCallback(
    async (patient: PatientSummary) => {
      setBusy(true);
      setPatientChoices(null);
      try {
        const visits = await listVisits(patient.id);
        if (visits.length === 0) {
          setSearchStatus("No saved forms for this patient.");
          return;
        }
        setPendingPatientLabel(patient.pat || patient.patid);
        if (visits.length === 1) {
          await loadVisit(visits[0].visit_id);
          return;
        }
        setPendingVisits(visits);
        setDosOpen(true);
        setSearchStatus("");
      } catch (err) {
        setSearchStatus(err instanceof ApiError ? err.message : "Could not list visits");
      } finally {
        setBusy(false);
      }
    },
    [loadVisit],
  );

  const runSearch = useCallback(
    async (query: { mode: "name_dob" | "member_id"; pat?: string; patdob?: string; subid?: string }) => {
      if (!ensureSession()) return;
      setBusy(true);
      setPatientChoices(null);
      setSearchStatus("Searching…");
      try {
        const patients =
          query.mode === "member_id"
            ? await searchPatients({ subid: query.subid })
            : await searchPatients({ pat: query.pat, patdob: query.patdob });

        if (patients.length === 0) {
          setSearchStatus("No patient found.");
          return;
        }
        if (patients.length === 1) {
          setSearchStatus("");
          await openVisitsForPatient(patients[0]);
          return;
        }
        setPatientChoices(patients);
        setSearchStatus("Multiple patients found — select one below.");
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setPinOpen(true);
        setSearchStatus(err instanceof ApiError ? err.message : "Search failed");
      } finally {
        setBusy(false);
      }
    },
    [ensureSession, openVisitsForPatient],
  );

  const onSave = useCallback(
    async (snapshot?: VoiFormValues): Promise<"saved" | "needs-pin" | "blocked" | "failed"> => {
      if (!ensureSession()) return "needs-pin";
      const values = snapshot ?? getValues();
      if (!canDerivePatientKey(values.office, values.patid)) {
        onStatus("Office name and Patient ID are required before saving.");
        return "blocked";
      }
      setBusy(true);
      try {
        const result = await saveVisit(values);
        setLoadedVisitId(result.visit_id);
        setLoadedPatientId(result.patient_id);
        onStatus(`Saved ${values.pat || "patient"} · DOS ${values.date}.`);
        return "saved";
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setPinOpen(true);
        onStatus(err instanceof ApiError ? err.message : "Save failed");
        return "failed";
      } finally {
        setBusy(false);
      }
    },
    [ensureSession, getValues, onStatus],
  );

  const openSearch = useCallback(() => {
    if (!ensureSession()) return;
    setSearchOpen(true);
    setSearchStatus("");
    setPatientChoices(null);
  }, [ensureSession]);

  const clearLoadedRecord = useCallback(() => {
    setLoadedVisitId(null);
    setLoadedPatientId(null);
  }, []);

  return {
    pinOpen,
    setPinOpen,
    searchOpen,
    setSearchOpen,
    dosOpen,
    setDosOpen,
    busy,
    searchStatus,
    patientChoices,
    pendingVisits,
    pendingPatientLabel,
    loadedVisitId,
    loadedPatientId,
    runSearch,
    openVisitsForPatient,
    loadVisit,
    onSave,
    openSearch,
    clearLoadedRecord,
    onPinSuccess: () => {
      setPinOpen(false);
      onStatus("Office session unlocked.");
    },
  };
}
