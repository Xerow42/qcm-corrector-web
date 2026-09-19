"use client";

import { Message } from "@/components/ui/Message";
import { PageHeader } from "@/components/ui/PageHeader";
import { useApi } from "@/hooks/useApi";
import { fetchClasses } from "@/lib/api";

export default function AdminClassesPage() {
  const { data, error } = useApi(fetchClasses);
  const classes = data ?? [];

  return (
    <div className="page">
      <PageHeader eyebrow="Admin" title="Classes & etudiants PostgreSQL">
        <p>Les identifiants affiches ici sont ceux a mettre sur les copies QCM.</p>
      </PageHeader>
      {error ? <Message variant="warning">{error}</Message> : null}
      {classes.map((schoolClass) => (
        <section className="surface" key={schoolClass.id}>
          <h3>{schoolClass.name}</h3>
          <p>{schoolClass.level} - {schoolClass.academic_year} - {schoolClass.students.length} etudiant(s)</p>
          <table>
            <thead><tr><th>Identifiant</th><th>Etudiant</th><th>Email</th><th>Statut</th></tr></thead>
            <tbody>
              {schoolClass.students.map((student) => (
                <tr key={student.id}>
                  <td><strong>{student.number}</strong></td>
                  <td>{student.first_name} {student.last_name}</td>
                  <td>{student.email}</td>
                  <td>{student.active ? "Actif" : "Inactif"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
