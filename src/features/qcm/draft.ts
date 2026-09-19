import { config } from "@/lib/config";
import type { QcmDraft, QcmQuestion } from "@/types";
import { CHOICE_KEYS } from "./constants";

export function newQuestion(order: number): QcmQuestion {
  return {
    id: `q-${order}-${Date.now()}`,
    order,
    prompt: "",
    points: 1,
    options: CHOICE_KEYS.map((key) => ({ key, text: "", isCorrect: false })),
  };
}

export function defaultDraft(): QcmDraft {
  return {
    code: `QCM-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    title: "",
    subjectName: "Reseaux",
    className: "Ingenierie 3A - Reseaux",
    classLevel: "3A",
    academicYear: "2025-2026",
    examDate: new Date().toISOString().slice(0, 10),
    teacherEmail: config.demoTeacher.email,
    teacherId: config.demoTeacher.id,
    questions: [newQuestion(1)],
  };
}
