import type { QcmQuestion } from "@/types";
import { MAX_QUESTIONS } from "../constants";
import { isQuestionComplete } from "../validation";

type Props = {
  questions: QcmQuestion[];
  selectedIndex: number;
  totalPoints: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
};

export function QuestionSidebar({ questions, selectedIndex, totalPoints, onSelect, onAdd }: Props) {
  const completeCount = questions.filter(isQuestionComplete).length;
  return (
    <aside className="side-panel">
      <p className="eyebrow">Questions</p>
      <strong>{completeCount} completes / {questions.length}</strong>
      <p className="muted">Vert: complet. Orange: champ manquant.</p>
      <div className="question-index">
        {questions.map((question, index) => (
          <button
            type="button"
            className={`${isQuestionComplete(question) ? "complete" : "incomplete"} ${selectedIndex === index ? "active" : ""}`}
            key={question.id}
            onClick={() => onSelect(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="toolbar" style={{ marginTop: 16 }}>
        <button type="button" className="secondary" onClick={onAdd}>Ajouter question</button>
      </div>
      <div className="surface compact shadow-none" style={{ marginTop: 16 }}>
        <strong>Contraintes</strong>
        <p className="mb-1 muted">Maximum: {MAX_QUESTIONS} questions.</p>
        <p className="mb-0 muted">Total: {totalPoints} points.</p>
      </div>
    </aside>
  );
}
