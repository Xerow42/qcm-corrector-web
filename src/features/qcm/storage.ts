import type { QcmDraft } from "@/types";
import { DRAFT_STORAGE_KEY } from "./constants";

/**
 * The draft (including correct answers) is kept in the teacher's browser only.
 * All accessors are safe against SSR, private mode and corrupted values.
 */
export function readStoredDraft(): QcmDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QcmDraft) : null;
  } catch {
    return null;
  }
}

export function writeStoredDraft(draft: QcmDraft): void {
  try {
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // Storage full or unavailable: the draft simply is not persisted.
  }
}

export function clearStoredDraft(): void {
  try {
    window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
