import type { QcmDraft } from "@/types";

type TextField = "title" | "code" | "examDate" | "subjectName" | "className" | "classLevel";

const FIELDS: ReadonlyArray<{ key: TextField; label: string; type?: "date" }> = [
  { key: "title", label: "Titre du QCM" },
  { key: "code", label: "Code QCM" },
  { key: "examDate", label: "Date d'examen", type: "date" },
  { key: "subjectName", label: "Matiere" },
  { key: "className", label: "Classe / groupe" },
  { key: "classLevel", label: "Niveau" },
];

type Props = {
  draft: QcmDraft;
  onChange: (next: QcmDraft) => void;
};

export function QcmMetaForm({ draft, onChange }: Props) {
  return (
    <section className="surface">
      <div className="grid three">
        {FIELDS.map(({ key, label, type }) => (
          <label key={key}>
            {label}
            <input type={type} value={draft[key]} onChange={(event) => onChange({ ...draft, [key]: event.target.value })} />
          </label>
        ))}
      </div>
    </section>
  );
}
