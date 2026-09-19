/** Branding and navigation, kept in one place so they are easy to swap. */
export const site = {
  name: "QCM Corrector",
  description: "Plateforme web de creation et de correction de QCM",
  institution: "JUNIA MAROC Grande ecole d'ingenieurs",
  logo: { src: "/logo-junia.png", alt: "JUNIA Maroc", size: 62 },
  nav: [
    { href: "/", label: "Tableau de bord" },
    { href: "/qcms", label: "Mes QCMs" },
    { href: "/qcms/new", label: "Nouveau QCM" },
    { href: "/sessions", label: "Sessions & resultats" },
    { href: "/admin/classes", label: "Classes" },
  ],
} as const;
