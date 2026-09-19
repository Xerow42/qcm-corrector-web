import type { QcmDraft, QcmQuestion } from "@/types";

export type ValidationResult = {
  completeIndexes: number[];
  incompleteIndexes: number[];
  errors: string[];
};

export function isQuestionComplete(question: QcmQuestion): boolean {
  const hasPrompt = question.prompt.trim().length > 0;
  const hasPoints = Number(question.points) > 0;
  const hasAllOptions = question.options.every((option) => option.text.trim().length > 0);
  const hasCorrect = question.options.some((option) => option.isCorrect);
  return hasPrompt && hasPoints && hasAllOptions && hasCorrect;
}

export function validateDraft(draft: QcmDraft): ValidationResult {
  const errors: string[] = [];
  if (!draft.title.trim()) errors.push("Titre du QCM manquant.");
  if (!draft.subjectName.trim()) errors.push("Matiere manquante.");
  if (!draft.className.trim()) errors.push("Classe ou groupe manquant.");
  if (!draft.examDate.trim()) errors.push("Date d'examen manquante.");

  const completeIndexes: number[] = [];
  const incompleteIndexes: number[] = [];
  draft.questions.forEach((question, index) => {
    if (isQuestionComplete(question)) {
      completeIndexes.push(index);
      return;
    }
    incompleteIndexes.push(index);
    const missing: string[] = [];
    if (!question.prompt.trim()) missing.push("enonce");
    if (!question.options.every((option) => option.text.trim())) missing.push("propositions");
    if (!question.options.some((option) => option.isCorrect)) missing.push("bonne reponse");
    if (!(Number(question.points) > 0)) missing.push("ponderation");
    errors.push(`Question ${index + 1}: ${missing.join(", ")}.`);
  });

  return { completeIndexes, incompleteIndexes, errors };
}

export function totalPoints(questions: QcmQuestion[]): number {
  return questions.reduce((sum, question) => sum + Number(question.points || 0), 0);
}
