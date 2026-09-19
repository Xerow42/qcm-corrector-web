import { useEffect, useState } from "react";
import type { QcmDraft } from "@/types";
import { readStoredDraft } from "../storage";

/** Reads the local draft once, after mount (localStorage does not exist on the server). */
export function useStoredDraft(): QcmDraft | null {
  const [draft, setDraft] = useState<QcmDraft | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDraft(readStoredDraft()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return draft;
}
