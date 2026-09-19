export type ChoiceKey = "A" | "B" | "C" | "D";

export type QcmOption = {
  key: ChoiceKey;
  text: string;
  isCorrect: boolean;
};

export type QcmQuestion = {
  id: string;
  order: number;
  prompt: string;
  points: number;
  options: QcmOption[];
};

export type QcmDraft = {
  code: string;
  title: string;
  subjectName: string;
  className: string;
  classLevel: string;
  academicYear: string;
  examDate: string;
  teacherEmail: string;
  teacherId: string;
  questions: QcmQuestion[];
};

/** Publication state understood by the backend. */
export type QcmPublicationStatus = "draft" | "published";

export type SyncQcmResponse = {
  status: "ok";
  qcm_id: string;
  session_id: string | null;
  qcm_code: string;
  question_count: number;
  max_score: number;
};
