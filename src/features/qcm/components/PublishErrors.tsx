export function PublishErrors({ errors }: { errors: string[] }) {
  return (
    <section className="surface">
      <p className="eyebrow">Erreurs de publication</p>
      <h3>Champs a corriger</h3>
      <ul>
        {errors.map((error) => <li key={error}>{error}</li>)}
      </ul>
    </section>
  );
}
