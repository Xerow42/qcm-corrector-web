import type { QcmDraft, SessionOverview } from "@/types";

export type QcmRowStatus = "published" | "draft" | "archived";
export type QcmFilter = "all" | QcmRowStatus;

export type QcmRow = {
  id: string;
  title: string;
  code: string;
  subject: string;
  className: string;
  questions: number;
  status: QcmRowStatus;
  updatedAt: string;
  sessionId?: string;
};

export const FILTERS: ReadonlyArray<{ value: QcmFilter; label: string }> = [
  { value: "all", label: "Tous" },
  { value: "published", label: "Publies" },
  { value: "draft", label: "Brouillons" },
  { value: "archived", label: "Archives" },
];

export function rowFromSession(session: SessionOverview): QcmRow {
  return {
    id: session.qcm_id,
    title: session.label,
    code: session.qcm_code,
    subject: "Depuis PostgreSQL",
    className: session.class.name || "-",
    questions: 0,
    status: session.state === "archive" ? "archived" : "published",
    updatedAt: session.exam_date,
    sessionId: session.id,
  };
}

export function rowFromDraft(draft: QcmDraft): QcmRow {
  return {
    id: "local-draft",
    title: draft.title || "Brouillon sans titre",
    code: draft.code,
    subject: draft.subjectName || "-",
    className: draft.className || "-",
    questions: draft.questions.length,
    status: "draft",
    updatedAt: new Date().toISOString(),
  };
}

/** Local draft first, then published/archived sessions coming from the API. */
export function buildRows(sessions: SessionOverview[], draft: QcmDraft | null): QcmRow[] {
  const rows = sessions.map(rowFromSession);
  if (draft) rows.unshift(rowFromDraft(draft));
  return rows;
}

export function filterRows(rows: QcmRow[], filter: QcmFilter): QcmRow[] {
  return filter === "all" ? rows : rows.filter((row) => row.status === filter);
}

export function countRows(rows: QcmRow[]) {
  return {
    all: rows.length,
    published: rows.filter((row) => row.status === "published").length,
    draft: rows.filter((row) => row.status === "draft").length,
    archived: rows.filter((row) => row.status === "archived").length,
  };
}

export function statusLabel(status: QcmRowStatus): string {
  if (status === "published") return "Publie";
  if (status === "archived") return "Archive";
  return "Brouillon";
}

export function statusTone(status: QcmRowStatus): "success" | "warning" | undefined {
  if (status === "published") return "success";
  if (status === "draft") return "warning";
  return undefined;
}
