type PageHeaderProps = {
  eyebrow: string;
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, actions, children }: PageHeaderProps) {
  return (
    <section className="surface header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {children}
      </div>
      {actions}
    </section>
  );
}
