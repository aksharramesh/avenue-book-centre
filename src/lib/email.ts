import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ─── SMTP Config Loader ──────────────────────────────────────────────────────

interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

/**
 * Reads SMTP credentials from the CMSContent table at runtime.
 * Returns null when host/user/pass are not configured → triggers simulation fallback.
 */
async function loadSMTPConfig(): Promise<SMTPConfig | null> {
  try {
    const keys = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"];
    const rows = await prisma.cMSContent.findMany({ where: { key: { in: keys } } });

    const get = (k: string) => rows.find((r) => r.key === k)?.value ?? "";

    const host = get("smtp_host").trim();
    const user = get("smtp_user").trim();
    const pass = get("smtp_pass").trim();

    // All three are required — missing any means SMTP is not configured
    if (!host || !user || !pass) return null;

    const portRaw = get("smtp_port").trim();
    const port = portRaw ? parseInt(portRaw, 10) : 587;

    // 'smtp_secure' field lets admin force SSL (true = port 465 mode)
    const secureField = get("smtp_secure").trim().toLowerCase();
    const secure = secureField === "true" || port === 465;

    const fromField = get("smtp_from").trim();
    const from = fromField || user; // fall back to username as sender address

    return { host, port, secure, user, pass, from };
  } catch (err) {
    console.error("[email] Failed to load SMTP config from DB:", err);
    return null;
  }
}

// ─── Main Send Function ───────────────────────────────────────────────────────

/**
 * Sends a transactional email.
 *
 * - When SMTP is configured in Admin › Settings › SMTP: delivers via nodemailer.
 * - Otherwise: logs to console + appends to emails.json (simulated mode).
 *
 * On SMTP failure: automatically falls back to simulation so the app never crashes.
 */
export async function sendSimulatedEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  const timestamp = new Date().toISOString();

  // ── 1. Try real SMTP delivery ─────────────────────────────────────────────
  const smtp = await loadSMTPConfig();

  if (smtp) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: { user: smtp.user, pass: smtp.pass },
        tls: { rejectUnauthorized: false }, // allow self-signed certs (Mailtrap, dev servers)
      });

      await transporter.sendMail({ from: smtp.from, to, subject, html });

      console.log("\n" + "═".repeat(64));
      console.log(`✅  SMTP EMAIL DELIVERED  [${timestamp}]`);
      console.log(`    To      : ${to}`);
      console.log(`    Subject : ${subject}`);
      console.log(`    Via     : ${smtp.host}:${smtp.port} (${smtp.secure ? "SSL" : "STARTTLS"})`);
      console.log("═".repeat(64) + "\n");
      return; // done — no fallback needed
    } catch (smtpErr) {
      console.error("\n⚠️  SMTP delivery failed — falling back to simulated log:");
      console.error(smtpErr);
    }
  }

  // ── 2. Simulated fallback ─────────────────────────────────────────────────
  const preview = html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 200);

  console.log("\n" + "─".repeat(64));
  console.log(`✉️   SIMULATED EMAIL  [${timestamp}]`);
  console.log(`    To      : ${to}`);
  console.log(`    Subject : ${subject}`);
  console.log(`    Preview : ${preview}...`);
  console.log("─".repeat(64) + "\n");

  // Persist to emails.json for the in-app email log viewer
  const logPath = path.join(process.cwd(), "emails.json");
  let log: unknown[] = [];

  try {
    if (fs.existsSync(logPath)) {
      log = JSON.parse(fs.readFileSync(logPath, "utf8"));
    }
  } catch {
    log = [];
  }

  log.push({ id: Math.random().toString(36).slice(2, 9), to, subject, html, sentAt: timestamp });

  try {
    fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");
  } catch (writeErr) {
    console.error("[email] Could not write to emails.json:", writeErr);
  }
}
