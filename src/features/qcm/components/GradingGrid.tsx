import { Badge } from "@/components/ui/Badge";
import type { QcmQuestion } from "@/types";
import { isQuestionComplete } from "../validation";

type Props = {
  questions: QcmQuestion[];
  totalPoints: number;
};

export function GradingGrid({ questions, totalPoints }: Props) {
  return (
    <section className="surface">
      <div className="header">
        <div>
          <p className="eyebrow">Recapitulatif</p>
          <h3>Grille de correction</h3>
        </div>
        <span className="pill">{questions.length} question(s) - {totalPoints} pts</span>
      </div>
      <table>
        <thead><tr><th>#</th><th>Enonce</th><th>Bonnes reponses</th><th>Points</th><th>Etat</th></tr></thead>
        <tbody>
          {questions.map((question, index) => {
            const complete = isQuestionComplete(question);
            return (
              <tr key={question.id}>
                <td>{index + 1}</td>
                <td>{question.prompt || <span className="muted">Enonce vide</span>}</td>
                <td>{question.options.filter((option) => option.isCorrect).map((option) => option.key).join(" ") || "-"}</td>
                <td>{question.points}</td>
                <td><Badge tone={complete ? "success" : "warning"}>{complete ? "Complet" : "A completer"}</Badge></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
