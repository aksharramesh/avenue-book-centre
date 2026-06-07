import prisma from "@/lib/prisma";
import { getCMSContent } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Sliders, Save, Sparkles, CheckCircle, Store, Settings2, HelpCircle } from "lucide-react";

export const metadata = {
  title: "System Settings | Avenue Book Centre Operations",
  robots: { index: false }
};

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams;

  // Pre-fetch general store settings from SQLite (using fallback defaults if not seeded yet)
  const storeName = (await getCMSContent("config_store_name")) || "Avenue Book Centre";
  const storeOwner = (await getCMSContent("config_store_owner")) || "Avenue Book Centre";
  const storeEmail = (await getCMSContent("config_store_email")) || "support@avenuebookcentre.com";
  const storePhone = (await getCMSContent("config_store_telephone")) || "+91 9820088220";
  const storeAddress = (await getCMSContent("config_store_address")) || "Bandra West, Hill Road, Mumbai 400050, India";

  // Homepage Hero Banner customizers
  const homeBannerAlert = (await getCMSContent("home_banner_alert")) || "Books & Custom Stationery";
  const homeHeroTitle = (await getCMSContent("home_hero_title")) || "Premium Novels, Guides & Custom Stationery";
  const homeHeroSubtext = (await getCMSContent("home_hero_subtext")) || "Avenue Book Centre provides premium novels, academic textbooks, custom journals, and fine stationery for readers.";

  // Operational parameters
  const storeCountry = (await getCMSContent("config_store_country")) || "India";
  const stockThreshold = (await getCMSContent("config_stock_threshold")) || "10";
  const showStorefrontButton = (await getCMSContent("config_show_storefront_button")) !== "false";
  const enableInlineEditing = (await getCMSContent("config_enable_inline_editing")) !== "false";
  const showBuyButtons = (await getCMSContent("config_show_buy_buttons")) !== "false";
  const enableWebImporter = (await getCMSContent("config_enable_web_importer")) !== "false";
  const maintenanceMode = (await getCMSContent("config_maintenance_mode")) === "true";

  // Server Action to update all fields inside sqlite CMS table
  async function saveSystemSettings(formData: FormData) {
    "use server";

    const sName = formData.get("config_store_name") as string;
    const sOwner = formData.get("config_store_owner") as string;
    const sEmail = formData.get("config_store_email") as string;
    const sPhone = formData.get("config_store_telephone") as string;
    const sAddress = formData.get("config_store_address") as string;

    const bannerAlert = formData.get("home_banner_alert") as string;
    const heroTitle = formData.get("home_hero_title") as string;
    const heroSubtext = formData.get("home_hero_subtext") as string;

    const country = formData.get("config_store_country") as string;
    const threshold = formData.get("config_stock_threshold") as string;
    const showStoreButton = formData.get("config_show_storefront_button") ? "true" : "false";
    const inlineEditing = formData.get("config_enable_inline_editing") ? "true" : "false";
    const buyButtons = formData.get("config_show_buy_buttons") ? "true" : "false";
    const webImporter = formData.get("config_enable_web_importer") ? "true" : "false";
    const maintMode = formData.get("config_maintenance_mode") ? "true" : "false";

    const upsertKey = async (key: string, value: string, desc: string) => {
      await prisma.cMSContent.upsert({
        where: { key },
        update: { value },
        create: { key, value, description: desc }
      });
    };

    await Promise.all([
      upsertKey("config_store_name", sName || "Avenue Book Centre", "Store Name"),
      upsertKey("config_store_owner", sOwner || "Avenue Book Centre", "Store Owner"),
      upsertKey("config_store_email", sEmail || "support@avenuebookcentre.com", "Support Email"),
      upsertKey("config_store_telephone", sPhone || "+91 9820088220", "Support Telephone"),
      upsertKey("config_store_address", sAddress || "Bandra West, Hill Road, Mumbai 400050, India", "Store Address"),
      upsertKey("home_banner_alert", bannerAlert || "Books & Custom Stationery", "Hero Announcement Alert"),
      upsertKey("home_hero_title", heroTitle || "Premium Novels, Guides & Custom Stationery", "Hero Main Title Heading"),
      upsertKey("home_hero_subtext", heroSubtext || "Avenue Book Centre provides premium novels, academic textbooks, custom journals, and fine stationery for readers.", "Hero Paragraph Subtext"),
      upsertKey("config_store_country", country || "India", "Default Storefront Country"),
      upsertKey("config_stock_threshold", threshold || "10", "Default Low-Stock Telemetry Threshold"),
      upsertKey("config_show_storefront_button", showStoreButton, "Show storefront exit button in admin dashboard sidebar"),
      upsertKey("config_enable_inline_editing", inlineEditing, "Enable direct inline price editing in catalog"),
      upsertKey("config_show_buy_buttons", buyButtons, "Show Buy Now / Add to Cart buttons on storefront"),
      upsertKey("config_enable_web_importer", webImporter, "Enable instant product URL importer on products page"),
      upsertKey("config_maintenance_mode", maintMode, "Enable scheduled maintenance mode for storefront"),
    ]);

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/settings/system");
    redirect("/admin/settings/system?success=true");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>System & Store Settings</h1>
        <p className="text-muted" style={{ margin: 0 }}>Configure physical retail store identities, dynamic storefront theme hero banners, and backend inventory parameters matching OpenCart standards.</p>
      </div>

      {/* Success notification */}
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
          <span>General system settings successfully synchronized and committed to SQLite! Homepage theme components revalidated.</span>
        </div>
      )}

      <form action={saveSystemSettings} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem" }}>
          
          {/* Card 1: General Store Identity */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
              <Store size={20} color="var(--brand-primary)" />
              Store Identity
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Store Name *</label>
                <input 
                  type="text" 
                  name="config_store_name" 
                  defaultValue={storeName} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Store Owner *</label>
                <input 
                  type="text" 
                  name="config_store_owner" 
                  defaultValue={storeOwner} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Support Email *</label>
                <input 
                  type="email" 
                  name="config_store_email" 
                  defaultValue={storeEmail} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Support Telephone *</label>
                <input 
                  type="text" 
                  name="config_store_telephone" 
                  defaultValue={storePhone} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Store Address *</label>
                <textarea 
                  name="config_store_address" 
                  defaultValue={storeAddress} 
                  required 
                  rows={3}
                  className="input-base" 
                  style={{ width: "100%", fontFamily: "inherit" }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Storefront Theme Hero Banner */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
              <Sparkles size={20} color="var(--brand-primary)" />
              Theme Hero Customizer
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Hero Announcement Alert *</label>
                <input 
                  type="text" 
                  name="home_banner_alert" 
                  defaultValue={homeBannerAlert} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Hero Main Title Heading *</label>
                <input 
                  type="text" 
                  name="home_hero_title" 
                  defaultValue={homeHeroTitle} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Hero Paragraph Subtext *</label>
                <textarea 
                  name="home_hero_subtext" 
                  defaultValue={homeHeroSubtext} 
                  required 
                  rows={6}
                  className="input-base" 
                  style={{ width: "100%", fontFamily: "inherit", lineHeight: 1.5 }}
                />
              </div>
            </div>
            
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <HelpCircle size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
              <span>Modifying these settings immediately re-renders the homepage Hero Banner dynamic text.</span>
            </div>
          </div>

          {/* Card 3: Storefront Operational Parameters */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
            <h2 style={{ fontSize: "1.25rem", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", color: "var(--text-primary)" }}>
              <Settings2 size={20} color="var(--brand-primary)" />
              Operational Parameters
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Default Country *</label>
                <input 
                  type="text" 
                  name="config_store_country" 
                  defaultValue={storeCountry} 
                  required 
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Default Low Stock Warning Threshold *</label>
                <input 
                  type="number" 
                  name="config_stock_threshold" 
                  defaultValue={stockThreshold} 
                  required 
                  min="0"
                  className="input-base" 
                  style={{ width: "100%" }}
                />
              </div>

              {/* Toggle storefront button in admin sidebar */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "1rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
                <input 
                  type="checkbox" 
                  name="config_show_storefront_button" 
                  id="config_show_storefront_button"
                  value="true"
                  defaultChecked={showStorefrontButton}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_show_storefront_button" style={{ fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-primary)" }}>
                  Show "Exit to Storefront" Button in Sidebar
                </label>
              </div>

              {/* Toggle inline price editing */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                <input 
                  type="checkbox" 
                  name="config_enable_inline_editing" 
                  id="config_enable_inline_editing"
                  value="true"
                  defaultChecked={enableInlineEditing}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_enable_inline_editing" style={{ fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-primary)" }}>
                  Enable Inline Price Editing in Catalog Table
                </label>
              </div>

              {/* Toggle storefront buy buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                <input 
                  type="checkbox" 
                  name="config_show_buy_buttons" 
                  id="config_show_buy_buttons"
                  value="true"
                  defaultChecked={showBuyButtons}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_show_buy_buttons" style={{ fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-primary)" }}>
                  Show Storefront "Buy Now / Add to Cart" Buttons
                </label>
              </div>

              {/* Toggle web importer module */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem" }}>
                <input 
                  type="checkbox" 
                  name="config_enable_web_importer" 
                  id="config_enable_web_importer"
                  value="true"
                  defaultChecked={enableWebImporter}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_enable_web_importer" style={{ fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-primary)" }}>
                  Show Instant Product URL Importer Module
                </label>
              </div>

              {/* Toggle website maintenance mode */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.5rem", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                <input 
                  type="checkbox" 
                  name="config_maintenance_mode" 
                  id="config_maintenance_mode"
                  value="true"
                  defaultChecked={maintenanceMode}
                  style={{ width: "1.25rem", height: "1.25rem", cursor: "pointer" }}
                />
                <label htmlFor="config_maintenance_mode" style={{ fontSize: "0.875rem", fontWeight: 700, cursor: "pointer", color: "var(--text-danger, #ef4444)" }}>
                  Enable Website Maintenance Mode (Shows Under Construction page)
                </label>
              </div>

            </div>
            
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <span>Stock thresholds dictate low-stock warnings shown dynamically on telemetry reporting charts. Toggle the Exit to Storefront button visibility using the checkbox.</span>
            </div>
          </div>

        </div>

        {/* Deploy settings */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2.5rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, borderRadius: "var(--radius-md)" }}>
            <Save size={18} /> Deploy System Settings
          </button>
        </div>
      </form>
    </div>
  );
}
