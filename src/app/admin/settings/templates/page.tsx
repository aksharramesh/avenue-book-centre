import prisma from "@/lib/prisma";
import { getCurrencySettings, updateCMSContent } from "@/app/actions";
import { Mail, Info, FileText, Layout, Award, Save, Sparkles, AlertCircle } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface TemplateDef {
  key: string;
  name: string;
  subject: string;
  body: string;
  description: string;
  tokens: string[];
}

const templatesConfig: TemplateDef[] = [
  {
    key: "template_email_welcome",
    name: "Welcome Newsletter",
    subject: "Welcome to Avenue Book Centre!",
    body: "<h1>Hi {customer_name}!</h1>\n<p>Thank you for registering at <strong>{store_name}</strong>. Explore our premium catalog of textbooks, corporate guides, and office supply solutions today.</p>\n<p>Use code <strong>{promo_code}</strong> at checkout for an exclusive 15% discount on your first order!</p>\n<p>Best regards,<br/>The {store_name} Team</p>",
    description: "Triggered instantly upon customer account registration.",
    tokens: ["{customer_name}", "{store_name}", "{promo_code}"]
  },
  {
    key: "template_email_order_confirm",
    name: "Order Confirmation",
    subject: "Your Avenue Book Centre Order Receipt #{order_id}",
    body: "<h1>Thank you for your purchase, {customer_name}!</h1>\n<p>We are processing your order <strong>#{order_id}</strong> immediately. Our dispatch channel is preparing shipment details.</p>\n<p><strong>Order Summary:</strong><br/>Total: {order_total}<br/>Delivery: Weight-Based India-Wide Dispatch</p>\n<p>Track order progress anytime in your account profile.</p>",
    description: "Sent right after checkout validation approval.",
    tokens: ["{customer_name}", "{order_id}", "{order_total}", "{store_name}"]
  },
  {
    key: "template_email_shipping_dispatch",
    name: "Shipping Dispatch",
    subject: "Your Avenue Book Centre order has shipped!",
    body: "<h1>Great news, {customer_name}!</h1>\n<p>Your order <strong>#{order_id}</strong> is on its way. Our logistics partners are delivering it to your international address.</p>\n<p>Estimated Delivery: 2-3 Business Days via Priority Dispatch.</p>",
    description: "Triggered when an order status advances to SHIPPED.",
    tokens: ["{customer_name}", "{order_id}", "{store_name}"]
  },
  {
    key: "template_email_newsletter",
    name: "Promo Newsletter",
    subject: "Exclusive Custom Book Deals Inside!",
    body: "<h1>Hello {customer_name}!</h1>\n<p>Up to 25% off on our bestsellers and curated corporate gifting collections. Redeem voucher code <strong>{promo_code}</strong> today.</p>\n<p>Elevate your office stationery with our modern slate-blue standard branding.</p>",
    description: "Standard advertising newsletter for customer marketing campaigns.",
    tokens: ["{customer_name}", "{promo_code}", "{store_name}"]
  }
];

export default async function EmailTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; success?: string }>;
}) {
  const resolvedParams = await searchParams;
  const activeKey = resolvedParams.template || "template_email_welcome";
  const showSuccess = resolvedParams.success === "true";

  const currency = await getCurrencySettings();

  // Seeding: ensure keys exist in database
  for (const def of templatesConfig) {
    const subKey = `${def.key}_subject`;
    const bodyKey = `${def.key}_body`;

    const subExists = await prisma.cMSContent.findUnique({ where: { key: subKey } });
    if (!subExists) {
      await prisma.cMSContent.create({
        data: { key: subKey, value: def.subject, description: `${def.name} Subject` }
      });
    }

    const bodyExists = await prisma.cMSContent.findUnique({ where: { key: bodyKey } });
    if (!bodyExists) {
      await prisma.cMSContent.create({
        data: { key: bodyKey, value: def.body, description: `${def.name} Body` }
      });
    }
  }

  // Fetch current editing template values from SQLite
  const currentDef = templatesConfig.find((t) => t.key === activeKey) || templatesConfig[0];
  const dbSubject = await prisma.cMSContent.findUnique({ where: { key: `${currentDef.key}_subject` } });
  const dbBody = await prisma.cMSContent.findUnique({ where: { key: `${currentDef.key}_body` } });

  const activeSubject = dbSubject?.value || currentDef.subject;
  const activeBody = dbBody?.value || currentDef.body;

  // Mock data replacement helper for static live preview
  const mockTokens: Record<string, string> = {
    "{customer_name}": "Aarav Sharma",
    "{order_id}": "INVOICE-677292",
    "{order_total}": `${currency.symbol}125.50`,
    "{store_name}": "Avenue Book Centre Store",
    "{promo_code}": "SUMMER25"
  };

  const getPreviewHTML = (subject: string, body: string) => {
    let previewSubject = subject;
    let previewBody = body;

    Object.entries(mockTokens).forEach(([token, mockVal]) => {
      previewSubject = previewSubject.replaceAll(token, mockVal);
      previewBody = previewBody.replaceAll(token, mockVal);
    });

    return `
      <html>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #334155; padding: 2rem; background: #f8fafc; line-height: 1.6;">
          <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background: #0f172a; padding: 1.5rem; text-align: center; color: #0ea5e9; font-weight: 800; font-size: 1.25rem; letter-spacing: 0.05em;">
              ✉️ INK & PAPER NEWSLETTER CHANNEL
            </div>
            <div style="padding: 2rem;">
              <div style="font-weight: 600; color: #1e293b; margin-bottom: 1.5rem; border-left: 4px solid #0ea5e9; padding-left: 0.75rem;">
                Subject: ${previewSubject}
              </div>
              <div style="font-size: 0.95rem; color: #475569;">
                ${previewBody.replaceAll("\n", "<br/>")}
              </div>
            </div>
            <div style="background: #f1f5f9; padding: 1rem 2rem; font-size: 0.75rem; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0;">
              Sent automatically by Avenue Book Centre Admin Operations. 
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const previewSrcDoc = getPreviewHTML(activeSubject, activeBody);

  // Server Action to save email template modifications
  async function saveTemplate(formData: FormData) {
    "use server";
    const key = formData.get("key") as string;
    const subject = formData.get("subject") as string;
    const body = formData.get("body") as string;

    if (!key) return;

    await updateCMSContent(`${key}_subject`, subject || "");
    await updateCMSContent(`${key}_body`, body || "");

    redirect(`/admin/settings/templates?template=${key}&success=true`);
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>
            Operational Control
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Email & Templates Settings
          </h1>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccess && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid var(--success)",
          color: "var(--success)",
          padding: "1rem 1.5rem",
          borderRadius: "var(--radius-lg)",
          fontSize: "0.95rem",
          fontWeight: 600,
          marginBottom: "2rem"
        }}>
          <Sparkles size={18} />
          <span>Email template configurations saved successfully to database!</span>
        </div>
      )}

      {/* Template Tab Selector */}
      <div style={{
        display: "flex",
        background: "var(--bg-secondary)",
        padding: "0.4rem",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        marginBottom: "2rem",
        gap: "0.25rem",
        overflowX: "auto"
      }}>
        {templatesConfig.map((t) => {
          const isSel = t.key === activeKey;
          return (
            <Link
              key={t.key}
              href={`/admin/settings/templates?template=${t.key}`}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                borderRadius: "var(--radius-md)",
                fontSize: "0.9rem",
                fontWeight: 600,
                textAlign: "center",
                whiteSpace: "nowrap",
                textDecoration: "none",
                background: isSel ? "#ffffff" : "transparent",
                color: isSel ? "var(--brand-primary)" : "var(--text-secondary)",
                boxShadow: isSel ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.2s"
              }}
            >
              {t.name}
            </Link>
          );
        })}
      </div>

      {/* Main Two-Column workspace */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.1fr 0.9fr",
        gap: "2rem",
        alignItems: "start"
      }} className="grid-2-responsive">
        
        {/* Left Side: Template Editor Form */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Mail size={18} color="var(--brand-primary)" />
            Configure Template
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            {currentDef.description}
          </p>

          <form action={saveTemplate} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <input type="hidden" name="key" value={currentDef.key} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 700 }}>Email Subject Line *</label>
              <input
                type="text"
                name="subject"
                required
                defaultValue={activeSubject}
                className="input-base"
                style={{ width: "100%", padding: "0.75rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                <span>Email Body Content (HTML Allowed) *</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>Pure HTML Structure</span>
              </label>
              <textarea
                name="body"
                required
                rows={12}
                defaultValue={activeBody}
                className="input-base"
                style={{ width: "100%", padding: "0.75rem", fontFamily: "monospace", fontSize: "0.85rem", lineHeight: 1.5 }}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%" }}>
              <Save size={16} /> Save Template Settings
            </button>
          </form>
        </div>

        {/* Right Side: Variable Guides & simulated preview iframe */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Guide Legend */}
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem"
          }}>
            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.35rem", color: "var(--text-primary)" }}>
              <Sparkles size={16} color="var(--brand-primary)" />
              Dynamic Variable Tokens
            </h4>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
              Use the following placeholders in your subject or body. Our dispatch engines automatically substitute them with checkout details:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
              {currentDef.tokens.map((token) => (
                <div key={token} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <code style={{ fontSize: "0.78rem", background: "#ffffff", border: "1px solid var(--border-color)", padding: "0.15rem 0.4rem", borderRadius: "4px", color: "var(--brand-primary)", fontWeight: "bold" }}>
                    {token}
                  </code>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {token === "{customer_name}" && "Customer's registered full name"}
                    {token === "{store_name}" && "Corporate store branding tag"}
                    {token === "{promo_code}" && "Coupon promo voucher code"}
                    {token === "{order_id}" && "Invoice receipt unique reference"}
                    {token === "{order_total}" && "Calculated grand checkout price"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* simulated Device Live Viewport */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
          }}>
            <div style={{ background: "var(--bg-secondary)", padding: "0.85rem 1.25rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Layout size={15} color="var(--brand-primary)" />
              <strong style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>Simulated Live Email Preview</strong>
            </div>
            
            <div style={{ width: "100%", height: "380px", background: "#f8fafc" }}>
              <iframe
                srcDoc={previewSrcDoc}
                title="Live Email Preview"
                style={{ width: "100%", height: "100%", border: "none" }}
              />
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
