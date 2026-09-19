import type { ChoiceKey } from "@/types";

/** The paper answer-sheet template accepts at most 60 questions. */
export const MAX_QUESTIONS = 60;

export const CHOICE_KEYS: readonly ChoiceKey[] = ["A", "B", "C", "D"];

/** localStorage key holding the teacher's in-progress draft. */
export const DRAFT_STORAGE_KEY = "qcm-corrector-clean-draft";
