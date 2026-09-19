import { LoginCard } from "@/components/auth/LoginCard";

export default function AdminLoginPage() {
  return <LoginCard eyebrow="Connexion admin" title="Administration" emailPlaceholder="admin@example.com" href="/admin/classes" />;
}
