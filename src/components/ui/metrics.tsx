export function MetricGrid({ children }: { children: React.ReactNode }) {
  return <section className="grid four">{children}</section>;
}

export function MetricCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="surface metric">
      <div>{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
