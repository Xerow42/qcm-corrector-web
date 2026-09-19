export default async function SubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="surface">
      <p className="eyebrow">Sujet PDF</p>
      <h2>QCM {id}</h2>
      <p>La version nettoyee conserve l&apos;impression navigateur via la page de creation/detail. Utilisez Ctrl+P pour generer le PDF.</p>
    </div>
  );
}
