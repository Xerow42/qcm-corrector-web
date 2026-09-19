export type SessionOverview = {
  id: string;
  qcm_id: string;
  qcm_code: string;
  label: string;
  exam_date: string;
  state: string;
  email_status: string;
  class: { id?: number | null; name?: string | null };
  copies: number;
  average_score: number;
  manual_checks: number;
};

export type SessionResult = {
  submission_id: string;
  score: number;
  max_score: number;
  status: string;
  answers?: Record<string, string[]>;
  detected?: { student_number?: string | null; name?: string | null };
  student?: {
    number?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
  correct_questions: number;
  total_questions: number;
  created_at?: string | null;
};

export type SessionResultsPayload = {
  session: {
    id: string;
    label: string;
    qcm_id: string;
    qcm_code: string;
    qcm_title: string;
    class_name?: string | null;
  };
  results: SessionResult[];
  summary: {
    copies: number;
    average_score: number;
    manual_checks: number;
  };
};
