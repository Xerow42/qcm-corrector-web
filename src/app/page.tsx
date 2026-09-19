import Link from "next/link";
import { RoleCard } from "@/components/auth/RoleCard";
import { MetricCard, MetricGrid } from "@/components/ui/metrics";
import { summarizeSessions } from "@/features/sessions/utils";
import { fetchSessions } from "@/lib/api";

export default async function HomePage() {
  const sessions = await fetchSessions().catch(() => []);
  const { copies, manualChecks } = summarizeSessions(sessions);
  return (
    <div className="page">
      <section className="hero">
        <div className="hero-main">
          <div>
            <p className="eyebrow">Plateforme QCM</p>
            <h2>Correction QCM centralisee</h2>
            <p>
              Creez vos QCMs, publiez la session, recevez les resultats IA et consultez le scoring pondere par etudiant.
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-dark btn-lg" href="/qcms/new">Creer un QCM</Link>
            <Link className="btn btn-outline-secondary btn-lg" href="/sessions">Voir resultats</Link>
          </div>
        </div>
        <div className="login-panel">
          <p className="eyebrow">Connexion</p>
          <h3>Acces plateforme</h3>
          <RoleCard href="/login/admin" icon="A" title="Administrateur" description="Classes, etudiants et professeurs." />
          <RoleCard href="/login/prof" icon="P" title="Professeur" description="Creation QCM et suivi des sessions." />
          <div className="surface shadow-none">
            <strong>Backend FastAPI</strong>
            <p className="mb-0 text-muted">Les resultats IA sont lus depuis PostgreSQL.</p>
          </div>
        </div>
      </section>
      <MetricGrid>
        <MetricCard label="Sessions" value={sessions.length} />
        <MetricCard label="Copies" value={copies} />
        <MetricCard label="A verifier" value={manualChecks} />
        <MetricCard label="API IA" value="ON" />
      </MetricGrid>
      <section className="surface">
        <h3>Dernieres sessions</h3>
        <table>
          <thead><tr><th>Session</th><th>Classe</th><th>Copies</th><th>Commande IA</th></tr></thead>
          <tbody>
            {sessions.slice(0, 4).map((session) => (
              <tr key={session.id}>
                <td><strong>{session.label}</strong><br />{session.qcm_code}</td>
                <td>{session.class.name || "-"}</td>
                <td>{session.copies}</td>
                <td><code>SESSION_ID=&quot;{session.id}&quot;</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
