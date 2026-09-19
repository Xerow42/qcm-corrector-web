#!/usr/bin/env node
/**
 * Lightweight guard against publishing sensitive data.
 *
 *   npm run check:secrets            scan the whole project
 *   node scripts/check-secrets.mjs <dir>   scan another folder
 *
 * It looks for hard-coded passwords, tokens, private keys, credentials in URLs,
 * real-looking e-mail addresses, private IPs, and files that should never be
 * committed (.env, keys, database dumps, archives). It never prints the secret
 * itself, only the file, the line and the rule that matched.
 * Add `secrets:ignore` in a comment on a line to silence a false positive.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";
import process from "node:process";

const root = resolve(process.argv[2] ?? ".");
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build", "coverage", ".vercel"]);
const SKIP_FILES = new Set(["package-lock.json", "check-secrets.mjs"]);
const BINARY_EXT = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".woff", ".woff2", ".pdf", ".zip"]);
const MAX_BYTES = 1_000_000;

const ALLOWED_EMAIL_DOMAINS = /^(example\.(com|org|net)|users\.noreply\.github\.com)$/i;
const PLACEHOLDER_VALUE = /^(|changeme|change-me|your[-_].*|<.*>|x{3,}|\*{3,})$/i;

/** Files that must never be published. `test` receives the file name and its path relative to the root. */
const FORBIDDEN_FILES = [
  { name: "environment file", test: (file) => /^\.env(\..+)?$/.test(file) && file !== ".env.example" },
  { name: "private key / certificate", test: (file) => /\.(pem|key|p12|pfx)$/i.test(file) || /^id_(rsa|ed25519)/.test(file) },
  { name: "database file or dump", test: (file) => /\.(sqlite3?|db|dump)$/i.test(file) },
  // SQL scripts are welcome in database/ (their content is still scanned) but not anywhere else.
  { name: "SQL file outside database/", test: (file, rel) => /\.sql$/i.test(file) && !rel.split(/[\\/]/).includes("database") },
  { name: "archive or backup", test: (file) => /\.(zip|tar|gz|7z|bak)$/i.test(file) },
];

/** Content rules, applied line by line. */
const CONTENT_RULES = [
  { name: "private key block", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "GitHub token", regex: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  { name: "AWS access key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Google API key", regex: /\bAIza[0-9A-Za-z_-]{35}\b/ },
  { name: "Slack token", regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/ },
  { name: "API secret key (sk-...)", regex: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { name: "JSON Web Token", regex: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  {
    name: "hard-coded credential assignment",
    regex: /\b(pass(word|wd)?|pwd|secret|token|api[-_]?key|access[-_]?key)\b["']?\s*[:=]\s*["'`][^"'`\s${}]{3,}["'`]/i,
  },
  { name: "password field with a preset value", regex: /type=["']password["'][^>]*\b(defaultValue|value)=["'][^"']+["']/i },
  { name: "credentials inside a URL", regex: /\b[a-z][a-z0-9+.-]*:\/\/[^\s:@/]+:[^\s@/]+@/i },
  { name: "private network address", regex: /\b(?:10\.\d{1,3}|192\.168|172\.(?:1[6-9]|2\d|3[01]))\.\d{1,3}\.\d{1,3}\b/ },
];

const EMAIL_REGEX = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;
const ENV_ASSIGNMENT = /^\s*[A-Z0-9_]*(PASSWORD|SECRET|TOKEN|API_KEY|PRIVATE_KEY)[A-Z0-9_]*\s*=\s*(.*)$/;

function listFiles() {
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.toString("utf8").split("\0").filter(Boolean);
  } catch {
    // Not a git repository (yet): walk the tree, skipping git-ignored env files.
    const found = [];
    const walk = (dir) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) {
          if (!SKIP_DIRS.has(entry)) walk(full);
        } else if (!/^\.env(\..+)?$/.test(entry) || entry === ".env.example") {
          found.push(relative(root, full));
        }
      }
    };
    walk(root);
    return found;
  }
}

const findings = [];
const report = (file, line, rule) => findings.push({ file, line, rule });

const files = listFiles().filter((file) => !file.split(/[\\/]/).some((part) => SKIP_DIRS.has(part)));
let scanned = 0;

for (const file of files) {
  const name = basename(file);
  for (const rule of FORBIDDEN_FILES) {
    if (rule.test(name, file)) report(file, 0, `forbidden file: ${rule.name}`);
  }
  if (SKIP_FILES.has(name) || BINARY_EXT.has(extname(name).toLowerCase())) continue;

  const full = join(root, file);
  let text;
  try {
    if (statSync(full).size > MAX_BYTES) continue;
    text = readFileSync(full, "utf8");
  } catch {
    continue;
  }
  scanned += 1;

  text.split(/\r?\n/).forEach((line, index) => {
    if (line.includes("secrets:ignore")) return;
    const lineNumber = index + 1;

    for (const rule of CONTENT_RULES) {
      if (rule.regex.test(line)) report(file, lineNumber, rule.name);
    }

    for (const match of line.matchAll(EMAIL_REGEX)) {
      if (!ALLOWED_EMAIL_DOMAINS.test(match[1])) report(file, lineNumber, "e-mail address (use @example.com)");
    }

    if (/^\.env/.test(name)) {
      const assignment = line.match(ENV_ASSIGNMENT);
      if (assignment && !PLACEHOLDER_VALUE.test(assignment[2].trim())) report(file, lineNumber, "secret value in an env file");
    }
  });
}

if (findings.length === 0) {
  process.stdout.write(`OK: no sensitive data found (${scanned} files scanned).\n`);
} else {
  process.stdout.write(`FAILED: ${findings.length} potential issue(s) found.\n`);
  for (const { file, line, rule } of findings) {
    process.stdout.write(`  ${file}${line ? `:${line}` : ""}  ${rule}\n`);
  }
  process.stdout.write("Remove or replace them before publishing (see README > Security).\n");
  process.exitCode = 1;
}
