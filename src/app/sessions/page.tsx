"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Message } from "@/components/ui/Message";
import { PageHeader } from "@/components/ui/PageHeader";
import { emailStatusLabel } from "@/features/sessions/utils";
import { useApi } from "@/hooks/useApi";
import { fetchSessions } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function SessionsPage() {
  const { data, error } = useApi(fetchSessions);
  const sessions = data ?? [];

  return (
    <div className="page">
      <PageHeader eyebrow="Principal" title="Sessions & resultats" />
      {error ? <Message variant="warning">{error}</Message> : null}
      <section className="surface">
        <table>
          <thead>
            <tr>
              <th>Session</th><th>Classe</th><th>Copie(s)</th><th>Moyenne</th><th>Controle manuel</th><th>Email</th><th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td><strong>{session.label}</strong><br /><span>{formatDate(session.exam_date)}</span><br /><code>SESSION_ID=&quot;{session.id}&quot;</code></td>
                <td>{session.class.name || "-"}</td>
                <td>{session.copies}</td>
                <td>{session.copies > 0 ? session.average_score : "-"}</td>
                <td>{session.manual_checks}</td>
                <td><Badge>{emailStatusLabel(session.email_status)}</Badge></td>
                <td><Link className="button" href={`/sessions/${session.id}`}>Voir resultats</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
