"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Message } from "@/components/ui/Message";
import { MetricCard, MetricGrid } from "@/components/ui/metrics";
import { PageHeader } from "@/components/ui/PageHeader";
import { useStoredDraft } from "@/features/qcm/hooks/useStoredDraft";
import { buildRows, countRows, FILTERS, filterRows, statusLabel, statusTone, type QcmFilter } from "@/features/qcm/rows";
import { useApi } from "@/hooks/useApi";
import { fetchSessions } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function QcmsPage() {
  const { data, error } = useApi(fetchSessions);
  const draft = useStoredDraft();
  const [filter, setFilter] = useState<QcmFilter>("all");

  const allRows = useMemo(() => buildRows(data ?? [], draft), [data, draft]);
  const rows = useMemo(() => filterRows(allRows, filter), [allRows, filter]);
  const stats = useMemo(() => countRows(allRows), [allRows]);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Principal"
        title="Mes QCMs"
        actions={<Link className="button" href="/qcms/new">Nouveau QCM</Link>}
      >
        <p className="muted">Filtrez les QCMs par statut et reprenez le brouillon local sauvegarde.</p>
      </PageHeader>

      {error ? <Message variant="warning">{error}</Message> : null}

      <MetricGrid>
        <MetricCard label="Total" value={stats.all} />
        <MetricCard label="Publies" value={stats.published} />
        <MetricCard label="Brouillons" value={stats.draft} />
        <MetricCard label="Archives" value={stats.archived} />
      </MetricGrid>

      <section className="surface">
        <div className="filterbar">
          {FILTERS.map((item) => (
            <button key={item.value} type="button" className={filter === item.value ? "" : "secondary"} onClick={() => setFilter(item.value)}>
              {item.label}
            </button>
          ))}
        </div>
        <table>
          <thead>
            <tr><th>QCM</th><th>Matiere</th><th>Classe</th><th>Questions</th><th>Statut</th><th>Derniere modification</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.status}-${row.id}`}>
                <td><strong>{row.title}</strong><br /><code>{row.code}</code></td>
                <td>{row.subject}</td>
                <td>{row.className}</td>
                <td>{row.questions || "-"}</td>
                <td><Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge></td>
                <td>{formatDate(row.updatedAt)}</td>
                <td>
                  <div className="toolbar">
                    {row.status === "draft" ? <Link className="button secondary" href="/qcms/new">Continuer</Link> : null}
                    {row.sessionId ? <Link className="button secondary" href={`/sessions/${row.sessionId}`}>Resultats</Link> : null}
                    {row.status === "published" ? <Link className="button secondary" href={`/qcms/${row.id}/subject`}>Sujet PDF</Link> : null}
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr><td colSpan={7}>Aucun QCM pour ce filtre.</td></tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
