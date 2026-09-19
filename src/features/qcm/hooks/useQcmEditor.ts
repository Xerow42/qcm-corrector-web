import { useEffect, useMemo, useState } from "react";
import { toErrorMessage } from "@/hooks/useApi";
import { syncQcm } from "@/lib/api";
import type { QcmDraft, QcmQuestion } from "@/types";
import { MAX_QUESTIONS } from "../constants";
import { defaultDraft, newQuestion } from "../draft";
import { clearStoredDraft, readStoredDraft, writeStoredDraft } from "../storage";
import { totalPoints as sumPoints, validateDraft } from "../validation";

/** All the state and actions of the MCQ editor page. */
export function useQcmEditor() {
  const [draft, setDraft] = useState<QcmDraft>(() => defaultDraft());
  const [loaded, setLoaded] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  // Restore the local draft after mount.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readStoredDraft();
      if (stored) {
        setDraft({ ...stored, questions: stored.questions?.length ? stored.questions : [newQuestion(1)] });
      }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  // Autosave every change once the stored draft has been restored.
  useEffect(() => {
    if (!loaded) return;
    writeStoredDraft(draft);
  }, [draft, loaded]);

  const validation = useMemo(() => validateDraft(draft), [draft]);
  const totalPoints = useMemo(() => sumPoints(draft.questions), [draft.questions]);
  const selectedQuestion = draft.questions[selectedIndex] || draft.questions[0];

  const update = (next: QcmDraft) => {
    setMessage("");
    setWarning("");
    setDraft(next);
  };

  const updateQuestion = (index: number, nextQuestion: QcmQuestion) => {
    const questions = [...draft.questions];
    questions[index] = { ...nextQuestion, order: index + 1 };
    update({ ...draft, questions });
  };

  const addQuestion = () => {
    if (draft.questions.length >= MAX_QUESTIONS) {
      setWarning(`Le template papier accepte ${MAX_QUESTIONS} questions maximum.`);
      return;
    }
    const questions = [...draft.questions, newQuestion(draft.questions.length + 1)];
    update({ ...draft, questions });
    setSelectedIndex(questions.length - 1);
  };

  const removeQuestion = (index: number) => {
    if (draft.questions.length === 1) {
      setWarning("Un QCM doit garder au moins une question.");
      return;
    }
    const questions = draft.questions
      .filter((_, itemIndex) => itemIndex !== index)
      .map((question, itemIndex) => ({ ...question, order: itemIndex + 1 }));
    update({ ...draft, questions });
    setSelectedIndex(Math.max(0, Math.min(index, questions.length - 1)));
  };

  const saveDraft = async () => {
    setShowErrors(false);
    writeStoredDraft(draft);
    setMessage("Brouillon sauvegarde localement. Vous pouvez reprendre ce QCM plus tard depuis Mes QCMs.");
    try {
      await syncQcm(draft, "draft");
      setMessage("Brouillon sauvegarde localement et synchronise avec PostgreSQL.");
    } catch {
      setWarning("Brouillon garde localement. La synchronisation PostgreSQL sera possible quand les champs obligatoires seront complets.");
    }
  };

  const publish = async () => {
    setShowErrors(true);
    setWarning("");
    setMessage("");
    if (validation.errors.length) {
      setWarning("Publication bloquee: corrigez les champs manquants affiches ci-dessous.");
      return;
    }
    try {
      const result = await syncQcm(draft, "published");
      setMessage(`QCM publie. Session generee: ${result.session_id || "en attente"}.`);
      writeStoredDraft(draft);
    } catch (error) {
      setWarning(toErrorMessage(error, "Erreur de publication."));
    }
  };

  const cancelDraft = () => {
    if (!window.confirm("Supprimer le brouillon local en cours ?")) return;
    clearStoredDraft();
    setDraft(defaultDraft());
    setSelectedIndex(0);
    setMessage("Brouillon local supprime. Nouveau QCM initialise.");
    setWarning("");
    setShowErrors(false);
  };

  return {
    draft,
    selectedIndex,
    selectedQuestion,
    validation,
    totalPoints,
    message,
    warning,
    showErrors,
    setSelectedIndex,
    update,
    updateQuestion,
    addQuestion,
    removeQuestion,
    saveDraft,
    publish,
    cancelDraft,
  };
}
