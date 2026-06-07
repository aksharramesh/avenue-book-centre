import prisma from "@/lib/prisma";
import { getCMSContent } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  Mail,
  Server,
  Lock,
  User,
  Send,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
} from "lucide-react";

export const metadata = {
  title: "SMTP Email Settings | Avenue Book Centre Operations",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

// ─── Server Action ────────────────────────────────────────────────────────────

async function saveSMTPSettings(formData: FormData) {
  "use server";

  const upsert = async (key: string, value: string, desc: string) => {
    await prisma.cMSContent.upsert({
      where: { key },
      update: { value },
      create: { key, value, description: desc },
    });
  };

  const host   = (formData.get("smtp_host")   as string) ?? "";
  const port   = (formData.get("smtp_port")   as string) ?? "587";
  const secure = (formData.get("smtp_secure") as string) ?? "false";
  const user   = (formData.get("smtp_user")   as string) ?? "";
  const pass   = (formData.get("smtp_pass")   as string) ?? "";
  const from   = (formData.get("smtp_from")   as string) ?? "";

  await Promise.all([
    upsert("smtp_host",   host,   "SMTP Server Hostname"),
    upsert("smtp_port",   port,   "SMTP Server Port"),
    upsert("smtp_secure", secure, "SMTP Force SSL/TLS (true = port-465 mode)"),
    upsert("smtp_user",   user,   "SMTP Login Username"),
    upsert("smtp_pass",   pass,   "SMTP Login Password / App Key"),
    upsert("smtp_from",   from,   "SMTP Sender From Address"),
  ]);

  revalidatePath("/admin/settings/smtp");
  redirect("/admin/settings/smtp?saved=true");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SMTPSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; cleared?: string }>;
}) {
  const params = await searchParams;

  // Load current values
  const smtpHost   = (await getCMSContent("smtp_host"))   ?? "";
  const smtpPort   = (await getCMSContent("smtp_port"))   ?? "587";
  const smtpSecure = (await getCMSContent("smtp_secure")) ?? "false";
  const smtpUser   = (await getCMSContent("smtp_user"))   ?? "";
  const smtpPass   = (await getCMSContent("smtp_pass"))   ?? "";
  const smtpFrom   = (await getCMSContent("smtp_from"))   ?? "";

  const isConfigured = !!(smtpHost && smtpUser && smtpPass);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>
          SMTP Email Server
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          Configure your outbound mail relay so that order confirmations, welcome emails, and shipping
          alerts are delivered as real emails. Leave all fields blank to keep using the built-in
          simulation log.
        </p>
      </div>

      {/* ── Status banners ─────────────────────────────────────────────── */}
      {params.saved && (
        <div style={{
          background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)",
          borderRadius: "var(--radius-md)", padding: "1rem 1.5rem",
          display: "flex", alignItems: "center", gap: "0.75rem", color: "#000000", fontSize: "0.9rem",
        }}>
          <CheckCircle size={20} color="#10b981" />
          <span>SMTP settings saved successfully. All transactional emails will now use this configuration.</span>
        </div>
      )}

      {/* ── Live status badge ───────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "0.6rem",
          padding: "0.6rem 1.25rem", borderRadius: "999px", fontWeight: 700, fontSize: "0.875rem",
          background: isConfigured ? "rgba(16,185,129,0.12)" : "rgba(234,179,8,0.12)",
          border: `1px solid ${isConfigured ? "rgba(16,185,129,0.35)" : "rgba(234,179,8,0.35)"}`,
          color: isConfigured ? "#10b981" : "#eab308",
        }}>
          {isConfigured
            ? <><CheckCircle size={16} /> SMTP Active — emails will be delivered via {smtpHost}</>
            : <><AlertCircle size={16} /> SMTP Not Configured — using simulated email log</>}
        </div>
      </div>

      {/* ── Form ───────────────────────────────────────────────────────── */}
      <form action={saveSMTPSettings} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "2rem" }}>

          {/* Card 1 — Server */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{
              fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)",
              display: "flex", alignItems: "center", gap: "0.5rem",
              borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem",
            }}>
              <Server size={18} color="var(--brand-primary)" /> Server Connection
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Host */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="smtp_host" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  SMTP Host
                </label>
                <input
                  id="smtp_host"
                  type="text"
                  name="smtp_host"
                  defaultValue={smtpHost}
                  placeholder="smtp.gmail.com"
                  className="input-base"
                  style={{ width: "100%" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  e.g. smtp.gmail.com · smtp.office365.com · smtp.mailtrap.io
                </span>
              </div>

              {/* Port + Secure row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label htmlFor="smtp_port" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    Port
                  </label>
                  <input
                    id="smtp_port"
                    type="number"
                    name="smtp_port"
                    defaultValue={smtpPort}
                    placeholder="587"
                    min="1" max="65535"
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label htmlFor="smtp_secure" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                    Encryption
                  </label>
                  <select
                    id="smtp_secure"
                    name="smtp_secure"
                    defaultValue={smtpSecure}
                    className="input-base"
                    style={{ width: "100%" }}
                  >
                    <option value="false">STARTTLS (port 587 / 25)</option>
                    <option value="true">SSL / TLS (port 465)</option>
                  </select>
                </div>
              </div>

            </div>
          </div>

          {/* Card 2 — Auth */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{
              fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-primary)",
              display: "flex", alignItems: "center", gap: "0.5rem",
              borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem",
            }}>
              <Lock size={18} color="var(--brand-primary)" /> Authentication
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

              {/* Username */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="smtp_user" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  SMTP Username
                </label>
                <div style={{ position: "relative" }}>
                  <User size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    id="smtp_user"
                    type="text"
                    name="smtp_user"
                    defaultValue={smtpUser}
                    placeholder="your@email.com"
                    autoComplete="off"
                    className="input-base"
                    style={{ width: "100%", paddingLeft: "2.25rem" }}
                  />
                </div>
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="smtp_pass" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  Password / App Key
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    id="smtp_pass"
                    type="password"
                    name="smtp_pass"
                    defaultValue={smtpPass}
                    placeholder="••••••••••••••••"
                    autoComplete="new-password"
                    className="input-base"
                    style={{ width: "100%", paddingLeft: "2.25rem" }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  For Gmail use a 16-char <strong>App Password</strong>, not your account password.
                </span>
              </div>

              {/* From address */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label htmlFor="smtp_from" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
                  From Address <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={15} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                  <input
                    id="smtp_from"
                    type="email"
                    name="smtp_from"
                    defaultValue={smtpFrom}
                    placeholder="noreply@avenuebookcentre.com"
                    className="input-base"
                    style={{ width: "100%", paddingLeft: "2.25rem" }}
                  />
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Defaults to SMTP Username if left blank.
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* ── Info panel ─────────────────────────────────────────────────── */}
        <div style={{
          background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: "var(--radius-md)", padding: "1.25rem 1.5rem",
          display: "flex", gap: "1rem", alignItems: "flex-start",
        }}>
          <Info size={18} color="#818cf8" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
            <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.4rem" }}>
              How it works
            </strong>
            When <strong>Host</strong>, <strong>Username</strong>, and <strong>Password</strong> are all
            filled in, every transactional email (order confirmations, welcome emails, shipping alerts)
            is delivered through your mail server in real-time.
            <br />
            Leave any of those three blank to revert to <strong>simulation mode</strong> — emails are
            logged to <code>emails.json</code> and printed to the server console instead of being sent.
            <br /><br />
            <strong>Quick reference:</strong><br />
            • Gmail SMTP: <code>smtp.gmail.com</code> · port <code>587</code> · STARTTLS<br />
            • Office 365: <code>smtp.office365.com</code> · port <code>587</code> · STARTTLS<br />
            • Mailtrap (testing): <code>sandbox.smtp.mailtrap.io</code> · port <code>2525</code><br />
            • SendGrid: <code>smtp.sendgrid.net</code> · port <code>587</code> · API key as password<br />
            • Mailgun: <code>smtp.mailgun.org</code> · port <code>587</code>
          </div>
        </div>

        {/* ── Submit ─────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem", marginTop: "0.5rem" }}>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "0.85rem 2.5rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, borderRadius: "var(--radius-md)" }}
          >
            <Save size={18} /> Save SMTP Settings
          </button>
        </div>

      </form>
    </div>
  );
}
