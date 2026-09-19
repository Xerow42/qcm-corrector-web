import Image from "next/image";
import Link from "next/link";
import { site } from "@/config/site";

export function TopBar() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label={`Accueil ${site.name}`}>
        <Image
          src={site.logo.src}
          alt={site.logo.alt}
          width={site.logo.size}
          height={site.logo.size}
          className="brand-logo"
          priority
        />
        <div>
          <p className="eyebrow">{site.name}</p>
          <h1>{site.institution}</h1>
        </div>
      </Link>
      <nav className="topnav" aria-label="Navigation principale">
        {site.nav.map((item) => (
          <Link key={item.href} href={item.href}>{item.label}</Link>
        ))}
      </nav>
      <div className="top-actions">
        <Link className="btn btn-outline-primary" href="/login">Connexion</Link>
        <Link className="btn btn-primary" href="/login/prof">Espace prof</Link>
      </div>
    </header>
  );
}
