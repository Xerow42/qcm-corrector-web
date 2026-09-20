#!/usr/bin/env node
/**
 * Demo API for the QCM Corrector web front-end.
 *
 *   npm run mock-api            (listens on http://127.0.0.1:8000)
 *   PORT=8100 npm run mock-api  (another port)
 *
 * It answers the same routes as the real backend, with FICTITIOUS data kept in memory
 * (nothing is stored on disk). Use it to try the interface, or to take screenshots,
 * without the real FastAPI backend and without any real student or teacher data.
 * It is a demo tool, not a replacement for the real backend.
 */
import { createServer } from "node:http";
import process from "node:process";

const PORT = Number(process.env.PORT) || 8000;
const HOST = "127.0.0.1";
const MAX_BODY_BYTES = 1_000_000;

// ---------- fictitious data ----------
const student = (id, number, first, last) => ({
  id,
  number,
  first_name: first,
  last_name: last,
  email: `${first}.${last}@example.com`.toLowerCase(),
  active: true,
});

const classes = [
  {
    id: 1,
    name: "Classe A",
    level: "3A",
    academic_year: "2025-2026",
    students: [
      student(1, "100001", "Alice", "Martin"),
      student(2, "100002", "Bruno", "Durand"),
      student(3, "100003", "Chloe", "Bernard"),
      { ...student(4, "100004", "David", "Petit"), active: false },
    ],
  },
  {
    id: 2,
    name: "Classe B",
    level: "3A",
    academic_year: "2025-2026",
    students: [
      student(5, "200001", "Emma", "Robert"),
      student(6, "200002", "Farid", "Moreau"),
      student(7, "200003", "Ines", "Laurent"),
    ],
  },
];
const allStudents = classes.flatMap((c) => c.students);

const answersFor = (seed) => {
  const letters = ["A", "B", "C", "D"];
  return Object.fromEntries(Array.from({ length: 10 }, (_, i) => [String(i + 1), [letters[(seed + i) % 4]]]));
};

const makeResult = (id, studentId, score, status, day, seed) => {
  const s = allStudents.find((item) => item.id === studentId);
  const linked = status === "valide" && s;
  return {
    submission_id: id,
    score,
    max_score: 20,
    status,
    answers: answersFor(seed),
    detected: { name: s ? `${s.first_name} ${s.last_name}` : "Nom illisible", student_number: s?.number ?? null },
    student: linked ? { number: s.number, first_name: s.first_name, last_name: s.last_name, email: s.email } : null,
    correct_questions: Math.round(score / 2),
    total_questions: 10,
    created_at: `2026-05-${String(day).padStart(2, "0")}T10:${String(seed).padStart(2, "0")}:00Z`,
  };
};

const sessions = [
  { id: "s1", qcm_id: "q1", qcm_code: "QCM-2026-1001", label: "Algorithmique - Controle 1", exam_date: "2026-05-20", state: "publie", email_status: "envoye", classId: 1,
    results: [makeResult("r1", 1, 18, "valide", 20, 11), makeResult("r2", 2, 14, "valide", 20, 12), makeResult("r3", 3, 16, "valide", 20, 13), makeResult("r4", 4, 8, "a_verifier", 20, 14)] },
  { id: "s2", qcm_id: "q2", qcm_code: "QCM-2026-1002", label: "Reseaux - Test 2", exam_date: "2026-05-22", state: "publie", email_status: "en_attente", classId: 2,
    results: [makeResult("r5", 5, 12, "valide", 22, 21), makeResult("r6", 6, 15, "valide", 22, 22), makeResult("r7", 99, 6, "a_verifier", 22, 23)] },
  { id: "s3", qcm_id: "q3", qcm_code: "QCM-2026-1003", label: "Bases de donnees - Quiz", exam_date: "2026-06-03", state: "publie", email_status: "en_attente", classId: 1, results: [] },
  { id: "s4", qcm_id: "q4", qcm_code: "QCM-2025-0917", label: "Python - Controle S2", exam_date: "2026-01-15", state: "archive", email_status: "envoye", classId: 2,
    results: [makeResult("r8", 7, 17, "valide", 15, 31), makeResult("r9", 5, 13, "valide", 15, 32)] },
];

const classById = (id) => classes.find((c) => c.id === id);
const round1 = (n) => Math.round(n * 10) / 10;
const average = (results) => (results.length ? round1(results.reduce((sum, r) => sum + r.score, 0) / results.length) : 0);
const manualChecks = (results) => results.filter((r) => r.status !== "valide").length;

const overview = (s) => ({
  id: s.id,
  qcm_id: s.qcm_id,
  qcm_code: s.qcm_code,
  label: s.label,
  exam_date: s.exam_date,
  state: s.state,
  email_status: s.email_status,
  class: { id: s.classId, name: classById(s.classId)?.name ?? null },
  copies: s.results.length,
  average_score: average(s.results),
  manual_checks: manualChecks(s.results),
});

// ---------- HTTP helpers ----------
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const send = (res, status, payload) => {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", ...CORS });
  res.end(JSON.stringify(payload));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {});
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });

let counter = 100;

const handlePost = async (req, res, path) => {
  let body;
  try {
    body = await readJson(req);
  } catch (error) {
    return send(res, 400, { detail: error.message });
  }
  const qcm = body.qcm ?? {};
  const questions = Array.isArray(qcm.questions) ? qcm.questions : [];
  const maxScore = questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
  const reply = { status: "ok", qcm_code: qcm.code ?? "QCM", question_count: questions.length, max_score: maxScore };

  if (path === "/api/qcms/draft") {
    return send(res, 200, { ...reply, qcm_id: "draft-1", session_id: null });
  }
  if (!String(qcm.title ?? "").trim() || questions.length === 0) {
    return send(res, 422, { detail: "Titre et au moins une question sont obligatoires." });
  }
  counter += 1;
  const session = {
    id: `s${counter}`,
    qcm_id: `q${counter}`,
    qcm_code: qcm.code ?? `QCM-${counter}`,
    label: String(qcm.title),
    exam_date: qcm.examDate || new Date().toISOString().slice(0, 10),
    state: "publie",
    email_status: "en_attente",
    classId: 1,
    results: [],
  };
  sessions.unshift(session);
  return send(res, 200, { ...reply, qcm_id: session.qcm_id, session_id: session.id });
};

const server = createServer(async (req, res) => {
  const path = new URL(req.url ?? "/", `http://${HOST}`).pathname;

  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    return res.end();
  }
  if (req.method === "GET" && path === "/api/sessions") {
    return send(res, 200, { sessions: sessions.map(overview) });
  }
  const results = path.match(/^\/api\/sessions\/([^/]+)\/results$/);
  if (req.method === "GET" && results) {
    const session = sessions.find((s) => s.id === decodeURIComponent(results[1]));
    if (!session) return send(res, 404, { detail: "Session inconnue" });
    const o = overview(session);
    return send(res, 200, {
      session: { id: session.id, label: session.label, qcm_id: session.qcm_id, qcm_code: session.qcm_code, qcm_title: session.label, class_name: o.class.name },
      results: session.results,
      summary: { copies: o.copies, average_score: o.average_score, manual_checks: o.manual_checks },
    });
  }
  if (req.method === "GET" && path === "/api/admin/classes") {
    return send(res, 200, { classes });
  }
  if (req.method === "POST" && (path === "/api/qcms/draft" || path === "/api/qcms/sync")) {
    return handlePost(req, res, path);
  }
  return send(res, 404, { detail: "Not Found" });
});

server.listen(PORT, HOST, () => {
  process.stdout.write(`Mock API running on http://${HOST}:${PORT}\n`);
  process.stdout.write("Fictitious data only, kept in memory. Press Ctrl+C to stop.\n");
});
