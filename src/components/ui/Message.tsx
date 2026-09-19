export function Message({ variant, children }: { variant?: "warning"; children: React.ReactNode }) {
  return <div className={variant ? `message ${variant}` : "message"}>{children}</div>;
}
