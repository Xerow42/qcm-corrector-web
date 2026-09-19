"use client";

import { useParams } from "next/navigation";
import { useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { Message } from "@/components/ui/Message";
import { MetricCard, MetricGrid } from "@/components/ui/metrics";
import { PageHeader } from "@/components/ui/PageHeader";
import { getStudentDisplay, resultStatus, sortedAnswers } from "@/features/sessions/utils";
import { useApi } from "@/hooks/useApi";
import { fetchSessionResults } from "@/lib/api";
import { formatDate } from "@/lib/format";

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>();
  const load = useCallback(() => fetchSessionResults(params.id), [params.id]);
  const { data, error } = useApi(load);

  if (error) return <Message variant="warning">{error}</Message>;
  if (!data) return <div className="surface">Chargement...</div>;

  return (
    <div className="page">
      <PageHeader eyebrow="Session & resultats" title={data.session.label}>
        <p>{data.session.class_name} - {data.session.qcm_code}</p>
        <code>SESSION_ID=&quot;{data.session.id}&quot;</code>
      </PageHeader>
      <MetricGrid>
        <MetricCard label="Copies" value={data.summary.copies} />
        <MetricCard label="Moyenne" value={data.summary.average_score} />
        <MetricCard label="Verification" value={data.summary.manual_checks} />
        <MetricCard label="QCM" value={data.session.qcm_id} />
      </MetricGrid>
      <section className="surface">
        <table>
          <thead>
            <tr><th>Etudiant</th><th>Identifiant</th><th>Score pondere</th><th>Questions correctes</th><th>Reponses detectees</th><th>Statut</th><th>Date</th></tr>
          </thead>
          <tbody>
            {data.results.map((result) => {
              const student = getStudentDisplay(result);
              const answers = sortedAnswers(result.answers);
              const status = resultStatus(result.status);
              return (
                <tr key={result.submission_id}>
                  <td><strong>{student.name}</strong><br />{student.email}</td>
                  <td>{student.number}</td>
                  <td><strong>{result.score} / {result.max_score}</strong></td>
                  <td>{result.correct_questions} / {result.total_questions}</td>
                  <td>
                    <details>
                      <summary>Voir {answers.length} reponses</summary>
                      <div className="answers">
                        {answers.map(([question, values]) => (
                          <span className="answer" key={question}>Q{question}: {values.join("") || "-"}</span>
                        ))}
                      </div>
                    </details>
                  </td>
                  <td><Badge tone={status.tone}>{status.label}</Badge></td>
                  <td>{formatDate(result.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
