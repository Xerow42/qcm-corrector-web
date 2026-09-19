import type { ChoiceKey, QcmOption, QcmQuestion } from "@/types";
import { isQuestionComplete } from "../validation";

type Props = {
  question: QcmQuestion;
  index: number;
  onChange: (question: QcmQuestion) => void;
  onAdd: () => void;
  onRemove: () => void;
};

export function QuestionCard({ question, index, onChange, onAdd, onRemove }: Props) {
  const complete = isQuestionComplete(question);

  const updateOption = (key: ChoiceKey, patch: Partial<QcmOption>) =>
    onChange({
      ...question,
      options: question.options.map((option) => (option.key === key ? { ...option, ...patch } : option)),
    });

  return (
    <article className={`question-card ${complete ? "complete" : "incomplete"}`}>
      <div className="question-head">
        <div>
          <p className="eyebrow">Question {index + 1}</p>
          <h3 className="mb-0">Saisie de l&apos;enonce et des propositions</h3>
        </div>
        <span className={`pill ${complete ? "success" : "warning"}`}>{complete ? "Complete" : "Incomplete"}</span>
      </div>

      <div className="grid two">
        <label>Enonce<textarea value={question.prompt} onChange={(event) => onChange({ ...question, prompt: event.target.value })} /></label>
        <label>Ponderation<input type="number" min={0.25} step={0.25} value={question.points} onChange={(event) => onChange({ ...question, points: Number(event.target.value) })} /></label>
      </div>

      <div className="choices mt-3">
        {question.options.map((option) => (
          <div className={`choice-box ${option.isCorrect ? "correct" : ""}`} key={option.key}>
            <label>Proposition {option.key}<input value={option.text} onChange={(event) => updateOption(option.key, { text: event.target.value })} /></label>
            <label className="mt-2" style={{ flexDirection: "row", alignItems: "center" }}>
              <input type="checkbox" checked={option.isCorrect} onChange={(event) => updateOption(option.key, { isCorrect: event.target.checked })} />
              Bonne reponse
            </label>
          </div>
        ))}
      </div>

      <div className="actions-row mt-3">
        <button type="button" className="secondary" onClick={onAdd}>Ajouter question</button>
        <button type="button" className="danger" onClick={onRemove}>Supprimer cette question</button>
      </div>
    </article>
  );
}
