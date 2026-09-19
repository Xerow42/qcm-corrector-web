import type { QcmDraft, QcmPublicationStatus, SyncQcmResponse } from "@/types";
import { apiPost } from "./http";

/** Maps the editor draft to the payload expected by the backend. */
export function buildQcmPayload(draft: QcmDraft, status: QcmPublicationStatus) {
  return {
    qcm: {
      code: draft.code,
      title: draft.title,
      audience: "class",
      status,
      examDate: draft.examDate,
      teacherId: draft.teacherId,
      questions: draft.questions.map((question, index) => ({
        ...question,
        order: index + 1,
        type: question.options.filter((option) => option.isCorrect).length > 1 ? "multiple" : "single",
      })),
    },
    context: {
      teacher_email: draft.teacherEmail,
      teacher_id: draft.teacherId,
      subject_name: draft.subjectName,
      subject_coefficient: 1,
      class_name: draft.className,
      class_level: draft.classLevel,
      academic_year: draft.academicYear,
    },
  };
}

export function syncQcm(draft: QcmDraft, status: QcmPublicationStatus): Promise<SyncQcmResponse> {
  const path = status === "published" ? "/api/qcms/sync" : "/api/qcms/draft";
  return apiPost<SyncQcmResponse>(path, buildQcmPayload(draft, status));
}
