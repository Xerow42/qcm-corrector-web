import Link from "next/link";

type LoginCardProps = {
  eyebrow: string;
  title: string;
  emailPlaceholder: string;
  href: string;
};

/** UI-only login form: no credential is checked in this repository. */
export function LoginCard({ eyebrow, title, emailPlaceholder, href }: LoginCardProps) {
  return (
    <div className="auth-card">
      <p className="eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      <label>Email<input type="email" placeholder={emailPlaceholder} autoComplete="username" /></label>
      <label>Mot de passe<input type="password" placeholder="Mot de passe" autoComplete="current-password" /></label>
      <Link className="button" href={href}>Entrer</Link>
    </div>
  );
}
