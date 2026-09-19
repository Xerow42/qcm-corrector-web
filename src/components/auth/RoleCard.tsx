import Link from "next/link";

type RoleCardProps = {
  href: string;
  icon: string;
  title: string;
  description: string;
};

export function RoleCard({ href, icon, title, description }: RoleCardProps) {
  return (
    <Link className="login-card" href={href}>
      <span className="login-icon">{icon}</span>
      <span><strong>{title}</strong><br /><small>{description}</small></span>
    </Link>
  );
}
