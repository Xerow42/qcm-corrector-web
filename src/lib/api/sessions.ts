import type { SessionOverview, SessionResultsPayload } from "@/types";
import { apiGet } from "./http";

export async function fetchSessions(): Promise<SessionOverview[]> {
  const payload = await apiGet<{ sessions: SessionOverview[] }>("/api/sessions");
  return payload.sessions;
}

export function fetchSessionResults(sessionId: string): Promise<SessionResultsPayload> {
  return apiGet<SessionResultsPayload>(`/api/sessions/${encodeURIComponent(sessionId)}/results`);
}
