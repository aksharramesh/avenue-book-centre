import { getCMSContent, updateCMSContent } from "@/app/actions";
import { redirect } from "next/navigation";
import { Edit3, Check, Globe, Layout, Sparkles } from "lucide-react";

export const metadata = {
  title: "CMS Banner Editor | Admin",
};

export default async function AdminCMSPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;

  // Retrieve current CMS contents
  const currentTitle = await getCMSContent("home_hero_title") || "Elevating Corporate Operations & Gifting";
  const currentSubtext = await getCMSContent("home_hero_subtext") || "Avenue Book Centre provides enterprise-grade supplies, premium stationary, and curated corporate gifts that build trust and drive excellence across your organization.";
  const currentAlert = await getCMSContent("home_banner_alert") || "Books & Corporate Stationery";

  // Action to save edits securely on the server
  async function saveCMS(formData: FormData) {
    "use server";
    
    const newTitle = formData.get("hero_title") as string;
    const newSubtext = formData.get("hero_subtext") as string;
    const newAlert = formData.get("banner_alert") as string;

    if (newTitle) await updateCMSContent("home_hero_title", newTitle);
    if (newSubtext) await updateCMSContent("home_hero_subtext", newSubtext);
    if (newAlert) await updateCMSContent("home_banner_alert", newAlert);

    redirect("/admin/cms?saved=true");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div>
        <h1 style={{ fontSize: "2rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layout size={28} color="var(--brand-primary)" /> Storefront Content Management (CMS)
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem" }}>
          Dynamically configure your storefront landing copy, discount alert ribbons, and hero banners.
        </p>
      </div>

      {saved && (
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
          fontWeight: 600
        }}>
          <Check size={20} />
          <span>Homepage banner CMS updated successfully! Visit your storefront homepage to see the modifications live.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "2.5rem", alignItems: "start" }} className="grid-responsive-3">
        {/* Editor Form */}
        <div className="card" style={{ padding: "2rem" }}>
          <form action={saveCMS} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            <fieldset style={{ border: "none", padding: 0, display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <legend style={{ fontSize: "1.2rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", width: "100%", paddingBottom: "0.5rem", marginBottom: "1rem", color: "var(--text-primary)" }}>
                Homepage Hero Section Copy
              </legend>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label className="label-base">Announcement Alert Ribbon *</label>
                <input
                  type="text"
                  name="banner_alert"
                  required
                  defaultValue={currentAlert}
                  className="input-base"
                  placeholder="e.g. Books & Corporate Stationery"
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Displays inside the rounded tag above the primary hero headline.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label className="label-base">Hero Section Title *</label>
                <input
                  type="text"
                  name="hero_title"
                  required
                  defaultValue={currentTitle}
                  className="input-base"
                  placeholder="e.g. Elevating Corporate Operations & Gifting"
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Primary high-impact bold headline. Max recommended length: 70 characters.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label className="label-base">Hero Description Copy *</label>
                <textarea
                  name="hero_subtext"
                  required
                  defaultValue={currentSubtext}
                  className="input-base"
                  rows={4}
                  placeholder="e.g. Avenue Book Centre provides supplies..."
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Secondary details paragraph below the headline. Re-explains store operations.
                </span>
              </div>
            </fieldset>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1rem", gap: "0.5rem" }}>
                <Edit3 size={18} /> Publish Live CMS Banners
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Blueprint */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ background: "var(--bg-tertiary)", padding: "1.5rem 2rem", border: "1.5px dashed var(--border-color)" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-secondary)" }}>
              <Globe size={18} /> Live Storefront Blueprint Preview
            </h3>
            
            {/* Mock Landing Banner Preview */}
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", textAlign: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.01)" }}>
              <div style={{
                display: "inline-block", 
                padding: "0.3rem 0.8rem", 
                background: "var(--bg-primary)", 
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-xl)",
                marginBottom: "1rem",
                fontWeight: 600,
                color: "var(--brand-primary)",
                fontSize: "0.75rem"
              }}>
                {currentAlert}
              </div>
              
              <h4 style={{ fontSize: "1.35rem", margin: "0 auto 0.75rem auto", fontWeight: 800, color: "var(--text-primary)", maxWidth: "340px", lineHeight: "1.3" }}>
                {currentTitle}
              </h4>
              
              <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 auto", lineHeight: "1.6", maxWidth: "300px" }}>
                {currentSubtext.length > 120 ? `${currentSubtext.substring(0, 120)}...` : currentSubtext}
              </p>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "1rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
              <Sparkles size={14} color="#f59e0b" /> Changes instantly update the homepage landing without rebuilds!
            </div>
          </div>

          {/* Quick CMS Rules */}
          <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: "0.5rem" }}>💡 CMS Editing Best Practices</h3>
            <ul style={{ paddingLeft: "1.25rem", fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem", lineHeight: "1.4" }}>
              <li><strong>Ribbon copy</strong> works best when limited to 3-4 words (e.g. "CBSE & ICSE School Guides").</li>
              <li><strong>Hero title</strong> should fit on 2 lines max on standard desktop monitors.</li>
              <li>Always check spelling before publishing to guarantee a high-quality B2C user experience.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}
