import { useFormContext, type FieldPath, type UseFormRegisterReturn } from "react-hook-form";
import type { ChangeEvent } from "react";
import { useHighlight } from "../highlight";
import { FrequencySelect, PercentSelect } from "./Fields";
import type { VoiFormValues } from "../types";

const cellClass = "ticket-control";

export function ProceduresTable() {
  const { register, watch } = useFormContext<VoiFormValues>();
  const { highlighted, markEdited } = useHighlight();
  const procedures = watch("procedures");

  return (
    <div className="ticket-scroll">
      <p className="sr-only">
        The procedure table scrolls horizontally on narrow screens. Tab through the cells to reach every field.
      </p>
      <table className="ticket-table">
        <caption className="sr-only">Procedure coverage</caption>
        <thead>
          <tr>
            <th scope="col">Code</th>
            <th scope="col">Covered %</th>
            <th scope="col">Procedure</th>
            <th scope="col">Frequency</th>
            <th scope="col">History / Last date of service</th>
          </tr>
        </thead>
        <tbody>
          {procedures.map((row, index) => {
            const historyPath = `procedures.${index}.history` as const;
            const rowLabel = row.code || `row ${index + 1}`;
            return (
              <tr key={`${row.code}-${index}`}>
                <td>
                  <span className="ticket-fixed">{row.code}</span>
                </td>
                <td>
                  <PercentSelect name={`procedures.${index}.pct`} label={`Covered percent for ${rowLabel}`} />
                </td>
                <td>
                  <span className="ticket-fixed">{row.name}</span>
                </td>
                <td>
                  <FrequencySelect name={`procedures.${index}.freq`} label={`Frequency for ${rowLabel}`} />
                </td>
                <td>
                  <input
                    {...editedInput(register(historyPath), historyPath, highlighted, markEdited)}
                    aria-label={`History for ${rowLabel}`}
                    placeholder={row.teeth ? "Teeth #:" : ""}
                    className={cellClass}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function editedInput(
  registration: UseFormRegisterReturn,
  path: FieldPath<VoiFormValues>,
  highlighted: ReadonlySet<string>,
  markEdited: (path: string) => void,
) {
  return {
    ...registration,
    "data-extracted": highlighted.has(path) ? "true" : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      void registration.onChange(event);
      markEdited(path);
    },
  };
}
