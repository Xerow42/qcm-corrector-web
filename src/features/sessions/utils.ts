import type { SessionOverview, SessionResult } from "@/types";
import type { BadgeTone } from "@/components/ui/Badge";

export function emailStatusLabel(value: string): string {
  if (value === "en_attente") return "En attente";
  if (value === "envoye") return "Envoye";
  return value;
}

export function summarizeSessions(sessions: SessionOverview[]) {
  return {
    copies: sessions.reduce((sum, session) => sum + session.copies, 0),
    manualChecks: sessions.reduce((sum, session) => sum + session.manual_checks, 0),
  };
}

export function resultStatus(status: string): { label: string; tone: BadgeTone } {
  return status === "valide" ? { label: "Valide", tone: "success" } : { label: "A verifier", tone: "warning" };
}

/** Student identity shown in the results table (linked student, else what the AI detected). */
export function getStudentDisplay(result: SessionResult) {
  const name = result.student
    ? `${result.student.first_name || ""} ${result.student.last_name || ""}`.trim()
    : result.detected?.name || "A verifier";
  const number = result.student?.number || result.detected?.student_number || "-";
  const email = result.student?.email || "Association en attente";
  return { name, number, email };
}

export function sortedAnswers(answers: SessionResult["answers"]): Array<[string, string[]]> {
  return Object.entries(answers || {}).sort(([a], [b]) => Number(a) - Number(b));
}
