export type BadgeTone = "success" | "warning";

export function Badge({ tone, children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return <span className={tone ? `badge ${tone}` : "badge"}>{children}</span>;
}
