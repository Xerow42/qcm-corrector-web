/**
 * Runtime configuration, read from environment variables.
 *
 * WARNING: every NEXT_PUBLIC_* variable is embedded in the JavaScript sent to
 * the browser. Never put a password, token or private key in one of them.
 */
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

export const config = {
  apiBaseUrl: trimTrailingSlash(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"),
  /** Pre-filled in the "New MCQ" form. Demo only: real identity must come from authentication. */
  demoTeacher: {
    email: process.env.NEXT_PUBLIC_DEMO_TEACHER_EMAIL || "teacher@example.com",
    id: process.env.NEXT_PUBLIC_DEMO_TEACHER_ID || "1",
  },
} as const;
