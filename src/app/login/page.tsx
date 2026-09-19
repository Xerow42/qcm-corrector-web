import { RoleCard } from "@/components/auth/RoleCard";

export default function LoginPage() {
  return (
    <div className="hero">
      <section className="hero-main">
        <p className="eyebrow">QCM Corrector</p>
        <h2>Bienvenue sur la plateforme de correction QCM</h2>
        <p>
          Connectez-vous comme administrateur ou enseignant pour gerer les classes, creer les QCMs et consulter les resultats IA.
        </p>
      </section>
      <section className="login-panel">
        <RoleCard href="/login/admin" icon="A" title="Admin" description="Gestion des professeurs, classes et etudiants." />
        <RoleCard href="/login/prof" icon="P" title="Professeur" description="Creation QCM, publication et suivi des corrections." />
      </section>
    </div>
  );
}
