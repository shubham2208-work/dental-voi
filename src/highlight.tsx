import { createContext, useContext } from "react";

export interface HighlightApi {
  highlighted: ReadonlySet<string>;
  markEdited: (path: string) => void;
}

const HighlightContext = createContext<HighlightApi | null>(null);

export const HighlightProvider = HighlightContext.Provider;

export function useHighlight(): HighlightApi {
  const value = useContext(HighlightContext);
  if (!value) throw new Error("HighlightProvider missing");
  return value;
}
