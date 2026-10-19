import { createContext, useContext, useEffect, useState, type ChangeEvent } from "react";
import { useFormContext, type FieldPath, type UseFormRegisterReturn } from "react-hook-form";
import { useHighlight } from "../highlight";
import type { FieldDef } from "../lib/field-types";
import { formatMoney, normalizeMoney, optionsWithValue } from "../lib/normalize";
import { FREQ_OPTIONS, MTC_OPTIONS, PCT_OPTIONS, PCT_STEP_OPTIONS, WAIT_OPTIONS, type MoneyId, type PctId, type VoiFormValues } from "../types";

const controlClass = "ticket-control";
const OTHER_PERCENT = "Other";

export const ResetEpochContext = createContext(0);

function isStandardPercent(value: string): boolean {
  return (PCT_OPTIONS as readonly string[]).includes(value);
}

function isStepPercent(value: string): boolean {
  return (PCT_STEP_OPTIONS as readonly string[]).includes(value) && !isStandardPercent(value);
}

function extractedProps(path: string, highlighted: ReadonlySet<string>, register: UseFormRegisterReturn, markEdited: (path: string) => void) {
  return {
    ...register,
    "data-extracted": highlighted.has(path) ? "true" : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      void register.onChange(event);
      markEdited(path);
    },
  };
}

export function FieldsGrid({
  fields,
  prominent = [],
  wide = [],
}: {
  fields: readonly FieldDef[];
  prominent?: readonly string[];
  wide?: readonly string[];
}) {
  return fields.map((field) => (
    <FieldControl key={field.name} field={field} prominent={prominent.includes(field.name)} wide={wide.includes(field.name)} />
  ));
}

function FieldControl({ field, prominent, wide }: { field: FieldDef; prominent: boolean; wide: boolean }) {
  switch (field.kind) {
    case "money":
      return <MoneyField name={field.name} label={field.label} />;
    case "pct":
      return <PctField name={field.name} label={field.label} />;
    case "byear":
      return <ChoiceField name="byear" label={field.label} options={["Calendar", "Fiscal"]} />;
    case "yesno":
      return <ChoiceField name="dedmet" label={field.label} options={["YES", "NO"]} />;
    case "wait":
      return <ChoiceField name={field.name} label={field.label} options={WAIT_OPTIONS} />;
    case "mtc":
      return <ChoiceField name="mtc" label={field.label} options={MTC_OPTIONS} />;
    case "notes":
      return <NotesField />;
    case "date":
      return <TextField name={field.name} label={field.label} type="date" />;
    case "text":
    case "clause":
      return <TextField name={field.name} label={field.label} prominent={prominent} wide={wide} />;
  }
}

function TextField({
  name,
  label,
  type = "text",
  prominent = false,
  wide = false,
}: {
  name: FieldPath<VoiFormValues>;
  label: string;
  type?: string;
  prominent?: boolean;
  wide?: boolean;
}) {
  const { register } = useFormContext<VoiFormValues>();
  const { highlighted, markEdited } = useHighlight();
  const registration = register(name);
  const fieldClass = ["ticket-field", prominent ? "ticket-field-lead" : "", wide ? "ticket-field-wide" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <label className={fieldClass}>
      <span className="ticket-label">{label}</span>
      <input
        {...extractedProps(name, highlighted, registration, markEdited)}
        type={type}
        autoComplete="off"
        spellCheck={type === "text"}
        className={prominent ? `${controlClass} ticket-lead` : controlClass}
      />
    </label>
  );
}

function ChoiceField({
  name,
  label,
  options,
}: {
  name: "byear" | "dedmet" | "bwait" | "mwait" | "mtc";
  label: string;
  options: readonly string[];
}) {
  const { register, watch } = useFormContext<VoiFormValues>();
  const { highlighted, markEdited } = useHighlight();
  const registration = register(name);
  const value = watch(name);
  return (
    <label className="ticket-field">
      <span className="ticket-label">{label}</span>
      <select {...extractedProps(name, highlighted, registration, markEdited)} className={controlClass}>
        <option value="">Select</option>
        {optionsWithValue(options, value).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function PctField({ name, label }: { name: PctId; label: string }) {
  return (
    <label className="ticket-field">
      <span className="ticket-label">{label}</span>
      <PercentChoices name={name} label={label} />
    </label>
  );
}

function PercentChoices({ name, label }: { name: FieldPath<VoiFormValues>; label: string }) {
  const { register, setValue, watch } = useFormContext<VoiFormValues>();
  const { highlighted, markEdited } = useHighlight();
  const registration = register(name);
  const watched = watch(name);
  const value = typeof watched === "string" ? watched : "";
  const [otherOpen, setOtherOpen] = useState(false);
  const resetEpoch = useContext(ResetEpochContext);
  const showSteps = otherOpen || isStepPercent(value);
  const listed = optionsWithValue(PCT_OPTIONS, isStepPercent(value) ? "" : value);
  const steps = PCT_STEP_OPTIONS.filter((option) => !listed.includes(option));

  useEffect(() => {
    setOtherOpen(false);
  }, [resetEpoch]);

  useEffect(() => {
    if (isStandardPercent(value)) setOtherOpen(false);
  }, [value]);

  function choose(next: string) {
    setValue(name, next, { shouldDirty: true, shouldTouch: true });
    markEdited(name);
  }

  return (
    <select
      ref={registration.ref}
      name={registration.name}
      aria-label={label}
      className={controlClass}
      data-extracted={highlighted.has(name) ? "true" : undefined}
      value={showSteps && value === "" ? OTHER_PERCENT : value}
      onBlur={registration.onBlur}
      onChange={(event) => {
        const next = event.target.value;
        if (next === OTHER_PERCENT) {
          setOtherOpen(true);
          if (!isStepPercent(value)) choose("");
          return;
        }
        if (next === "" || isStandardPercent(next)) setOtherOpen(false);
        choose(next);
      }}
    >
      <option value="">Select</option>
      {listed.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
      {showSteps
        ? steps.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))
        : null}
      {isStepPercent(value) ? null : <option value={OTHER_PERCENT}>Other</option>}
    </select>
  );
}

export function FrequencySelect({ name, label }: { name: FieldPath<VoiFormValues>; label: string }) {
  const { register, watch } = useFormContext<VoiFormValues>();
  const { highlighted, markEdited } = useHighlight();
  const registration = register(name);
  const watched = watch(name);
  const value = typeof watched === "string" ? watched : "";
  return (
    <select {...extractedProps(name, highlighted, registration, markEdited)} aria-label={label} className={controlClass}>
      <option value="">Select</option>
      {optionsWithValue(FREQ_OPTIONS, value).map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function PercentSelect({ name, label }: { name: FieldPath<VoiFormValues>; label: string }) {
  return <PercentChoices name={name} label={label} />;
}

function NotesField() {
  const { register } = useFormContext<VoiFormValues>();
  const { highlighted, markEdited } = useHighlight();
  const registration = register("notes");
  return (
    <label className="ticket-field ticket-notes">
      <span className="ticket-label">Notes</span>
      <textarea
        {...extractedProps("notes", highlighted, registration, markEdited)}
        rows={2}
        className={controlClass}
      />
    </label>
  );
}

function MoneyField({ name, label }: { name: MoneyId; label: string }) {
  const { watch, setValue } = useFormContext<VoiFormValues>();
  const value = watch(name);
  const { highlighted, markEdited } = useHighlight();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    if (!focused) setText(formatMoney(value));
  }, [focused, value]);

  return (
    <label className="ticket-field">
      <span className="ticket-label">{label}</span>
      <input
        value={focused ? text : formatMoney(value)}
        autoComplete="off"
        inputMode="decimal"
        data-extracted={highlighted.has(name) ? "true" : undefined}
        className={controlClass}
        onFocus={() => {
          setFocused(true);
          setText(value === null ? "" : String(value));
        }}
        onBlur={() => {
          setFocused(false);
          if (text.trim() === "") {
            setValue(name, null, { shouldDirty: true });
            return;
          }
          const parsed = normalizeMoney(text);
          if (parsed === null) {
            setText(formatMoney(value));
            return;
          }
          setValue(name, parsed, { shouldDirty: true });
        }}
        onChange={(event) => {
          setText(event.target.value);
          markEdited(name);
        }}
      />
    </label>
  );
}
