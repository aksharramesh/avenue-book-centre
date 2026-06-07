import prisma from "@/lib/prisma";
import { getCMSContent } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Save, CheckCircle, BarChart2, Shield, Code, Settings, Activity } from "lucide-react";

export const metadata = {
  title: "Tracking Modules | Avenue Book Centre Operations",
  robots: { index: false }
};

export const dynamic = "force-dynamic";

export default async function TrackingSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams;

  // Pre-fetch tracking settings
  const gaActive = (await getCMSContent("config_google_analytics_active")) === "true";
  const gaId = (await getCMSContent("config_google_analytics_id")) || "";

  const gtmActive = (await getCMSContent("config_gtm_active")) === "true";
  const gtmId = (await getCMSContent("config_gtm_id")) || "";

  const fbActive = (await getCMSContent("config_facebook_pixel_active")) === "true";
  const fbId = (await getCMSContent("config_facebook_pixel_id")) || "";

  const customHeadScript = (await getCMSContent("config_custom_head_script")) || "";
  const customBodyScript = (await getCMSContent("config_custom_body_script")) || "";

  // Server Action to update settings in sqlite
  async function saveTrackingSettings(formData: FormData) {
    "use server";

    const gaActiveVal = formData.get("config_google_analytics_active") ? "true" : "false";
    const gaIdVal = (formData.get("config_google_analytics_id") as string) || "";

    const gtmActiveVal = formData.get("config_gtm_active") ? "true" : "false";
    const gtmIdVal = (formData.get("config_gtm_id") as string) || "";

    const fbActiveVal = formData.get("config_facebook_pixel_active") ? "true" : "false";
    const fbIdVal = (formData.get("config_facebook_pixel_id") as string) || "";

    const customHeadVal = (formData.get("config_custom_head_script") as string) || "";
    const customBodyVal = (formData.get("config_custom_body_script") as string) || "";

    const upsertKey = async (key: string, value: string, desc: string) => {
      await prisma.cMSContent.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: desc }
      });
    };

    await Promise.all([
      upsertKey("config_google_analytics_active", gaActiveVal, "Enable/Disable Google Analytics"),
      upsertKey("config_google_analytics_id", gaIdVal.trim(), "Google Analytics GA4 Measurement ID"),
      upsertKey("config_gtm_active", gtmActiveVal, "Enable/Disable Google Tag Manager"),
      upsertKey("config_gtm_id", gtmIdVal.trim(), "Google Tag Manager Container ID"),
      upsertKey("config_facebook_pixel_active", fbActiveVal, "Enable/Disable Facebook Pixel"),
      upsertKey("config_facebook_pixel_id", fbIdVal.trim(), "Facebook Pixel ID"),
      upsertKey("config_custom_head_script", customHeadVal, "Custom tracking/verification HTML to inject in head"),
      upsertKey("config_custom_body_script", customBodyVal, "Custom tracking/verification HTML to inject in body footer")
    ]);

    revalidatePath("/");
    revalidatePath("/admin/settings/tracking");
    redirect("/admin/settings/tracking?success=true");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Title */}
      <div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>
          Tracking & Analytics Modules
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          Manage customer behavior tracking integrations and custom script tags. Codes are injected automatically into storefront layouts.
        </p>
      </div>

      {/* Success Banner */}
      {params.success && (
        <div style={{ 
          backgroundColor: "rgba(16, 185, 129, 0.15)", 
          border: "1px solid rgba(16, 185, 129, 0.4)", 
          color: "#000000", 
          padding: "1rem 1.5rem", 
          borderRadius: "var(--radius-md)", 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem",
          fontSize: "0.9rem"
        }}>
          <CheckCircle size={20} color="#10b981" />
          <span>Tracking settings updated successfully! Storefront routing caches have been revalidated.</span>
        </div>
      )}

      <form action={saveTrackingSettings} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "2rem" }}>
          
          {/* Card 1: Google Analytics */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
              <BarChart2 size={20} color="var(--brand-primary)" />
              Google Analytics (GA4)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input 
                  type="checkbox" 
                  name="config_google_analytics_active" 
                  id="config_google_analytics_active"
                  value="true"
                  defaultChecked={gaActive}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_google_analytics_active" style={{ fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                  Enable Google Analytics
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>GA4 Measurement ID</label>
                <input 
                  type="text" 
                  name="config_google_analytics_id" 
                  defaultValue={gaId} 
                  placeholder="G-XXXXXXXXXX" 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  e.g., G-B7H6P9K2M3. Tracks page views, clicks, and checkout events.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Google Tag Manager */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
              <Activity size={20} color="var(--brand-primary)" />
              Google Tag Manager (GTM)
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input 
                  type="checkbox" 
                  name="config_gtm_active" 
                  id="config_gtm_active"
                  value="true"
                  defaultChecked={gtmActive}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_gtm_active" style={{ fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                  Enable Google Tag Manager
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>GTM Container ID</label>
                <input 
                  type="text" 
                  name="config_gtm_id" 
                  defaultValue={gtmId} 
                  placeholder="GTM-XXXXXXX" 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  e.g., GTM-T5K9LMQ. Injects the async script tags into headers and iframe fallbacks in body.
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Facebook Pixel */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
              <Shield size={20} color="var(--brand-primary)" />
              Meta (Facebook) Pixel
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <input 
                  type="checkbox" 
                  name="config_facebook_pixel_active" 
                  id="config_facebook_pixel_active"
                  value="true"
                  defaultChecked={fbActive}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_facebook_pixel_active" style={{ fontSize: "0.9rem", fontWeight: 700, cursor: "pointer" }}>
                  Enable Meta Pixel
                </label>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Meta Pixel ID</label>
                <input 
                  type="text" 
                  name="config_facebook_pixel_id" 
                  defaultValue={fbId} 
                  placeholder="1234567890" 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  e.g., 102030405060. Monitors pageviews and matches checkout triggers.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Card 4: Custom Script Injection (Full Width) */}
        <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
          <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
            <Code size={20} color="var(--brand-primary)" />
            Custom Script Injections
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Inject custom verification meta tags, custom stylesheets, customer chat widgets, or specialized third-party affiliate pixels.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 700 }}>Custom Header Scripts (&lt;head&gt;)</label>
              <textarea 
                name="config_custom_head_script" 
                defaultValue={customHeadScript} 
                placeholder="<!-- Paste custom scripts here to inject inside <head> -->" 
                rows={5}
                className="input-base" 
                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.4 }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Perfect for domain verification meta tags or pre-loading stylesheets. Be sure to wrap code inside valid HTML script tags if necessary.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 700 }}>Custom Footer Scripts (before &lt;/body&gt;)</label>
              <textarea 
                name="config_custom_body_script" 
                defaultValue={customBodyScript} 
                placeholder="<!-- Paste custom scripts here to inject at the end of the <body> -->" 
                rows={5}
                className="input-base" 
                style={{ width: "100%", fontFamily: "monospace", fontSize: "0.8rem", lineHeight: 1.4 }}
              />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Suitable for live chat widgets, cookie consent banners, or tracking pixels that do not need to block page rendering.
              </span>
            </div>
          </div>
        </div>

        {/* Deploy Panel */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2.5rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, borderRadius: "var(--radius-md)" }}>
            <Save size={18} /> Update Tracking Configurations
          </button>
        </div>
      </form>
    </div>
  );
}
