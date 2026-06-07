import { getCurrencySettings, updateCMSContent } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { DollarSign, Landmark, HelpCircle, RefreshCw, CheckCircle } from "lucide-react";
import prisma from "@/lib/prisma";

export const metadata = {
  title: "Currency Settings | Avenue Book Centre",
  robots: { index: false }
};

export default async function CurrencySettingsPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const params = await searchParams;
  const currentCurrency = await getCurrencySettings();
  
  // Quick pre-configured templates
  const presets = [
    { name: "Indian Rupee", code: "INR", symbol: "₹", flag: "🇮🇳" },
    { name: "US Dollar", code: "USD", symbol: "$", flag: "🇺🇸" },
    { name: "Turkish Lira", code: "TRY", symbol: "₺", flag: "🇹🇷" },
    { name: "Euro", code: "EUR", symbol: "€", flag: "🇪🇺" },
    { name: "British Pound", code: "GBP", symbol: "£", flag: "🇬🇧" },
    { name: "Saudi Riyal", code: "SAR", symbol: "SR", flag: "🇸🇦" },
    { name: "UAE Dirham", code: "AED", symbol: "AED", flag: "🇦🇪" }
  ];

  // Server Action to update currency settings
  async function saveCurrencyAction(formData: FormData) {
    "use server";
    
    const code = formData.get("code") as string;
    const symbol = formData.get("symbol") as string;

    if (!code || !symbol) {
      return;
    }

    await updateCMSContent("store_currency_code", code.toUpperCase().trim());
    await updateCMSContent("store_currency_symbol", symbol.trim());

    revalidatePath("/", "layout");
    revalidatePath("/admin/settings/currency");
  }

  // Quick select preset action
  async function applyPresetAction(code: string, symbol: string) {
    "use server";
    await updateCMSContent("store_currency_code", code);
    await updateCMSContent("store_currency_symbol", symbol);
    revalidatePath("/", "layout");
    revalidatePath("/admin/settings/currency");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Title Header */}
      <div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Currency Manager</h1>
        <p className="text-muted" style={{ margin: 0 }}>Configure default payment currencies, custom currency symbols, and dynamic storefront display formats.</p>
      </div>

      {/* Success/Error notifications */}
      {params.success && (
        <div style={{ 
          backgroundColor: "rgba(16, 185, 129, 0.15)", 
          border: "1px solid rgba(16, 185, 129, 0.4)", 
          color: "#000000", 
          padding: "1rem", 
          borderRadius: "var(--radius-md)", 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem",
          fontSize: "0.9rem"
        }}>
          <CheckCircle size={20} color="#10b981" />
          <span>Currency settings successfully synchronized across storefront and checkout channels!</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
        {/* Settings form container */}
        <div className="card" style={{ padding: "2.5rem", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Landmark size={20} color="var(--brand-primary)" />
              Default Store Currency
            </h2>
            <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>Configure the code and symbol used globally for pricing catalogs, checkout, and invoice calculations.</p>
          </div>

          <form action={saveCurrencyAction} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Currency Code (e.g. INR, USD, TRY)</label>
              <input 
                type="text" 
                name="code" 
                defaultValue={currentCurrency.code} 
                required 
                maxLength={5}
                placeholder="USD" 
                className="input" 
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Currency Symbol (e.g. ₹, $, ₺, €)</label>
              <input 
                type="text" 
                name="symbol" 
                defaultValue={currentCurrency.symbol} 
                required 
                maxLength={8}
                placeholder="$" 
                className="input" 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "0.875rem", marginTop: "0.5rem", display: "flex", justifyContent: "center", gap: "0.5rem", fontWeight: 600 }}>
              <RefreshCw size={18} /> Update Currency Settings
            </button>
          </form>
        </div>

        {/* Live Preview Card & Presets */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Live Preview Panel */}
          <div className="card" style={{ 
            padding: "2rem", 
            background: "linear-gradient(135deg, var(--bg-secondary) 0%, rgba(245, 158, 11, 0.05) 100%)",
            border: "1px solid var(--border-color)",
            display: "flex",
            flexDirection: "column",
            gap: "1.5rem"
          }}>
            <div>
              <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>Live Storefront Preview</span>
              <h3 style={{ fontSize: "1.25rem", margin: "0.25rem 0 0 0" }}>Price Compilation</h3>
            </div>

            <div style={{ padding: "1.5rem", background: "var(--bg-primary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Seeded Textbook Price:</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800 }}>{currentCurrency.symbol} 25.00</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "0.75rem" }}>
                <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Calculated Order Subtotal:</span>
                <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--brand-primary)" }}>{currentCurrency.symbol} 120.00</span>
              </div>
            </div>

            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "flex-start", lineHeight: 1.5 }}>
              <HelpCircle size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
              <span>Updating this setting immediately modifies the display currency for all public store pages, the cart drawer, checkout pipelines, and historical invoicing analytics dashboards.</span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Standard Presets</h3>
            <p className="text-muted" style={{ fontSize: "0.8rem", margin: 0 }}>Click any preset to instantly apply regional settings.</p>
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.5rem" }}>
              {presets.map((preset) => (
                <form key={preset.code} action={async () => {
                  "use server";
                  await applyPresetAction(preset.code, preset.symbol);
                }}>
                  <button 
                    type="submit" 
                    className="btn btn-outline" 
                    style={{ 
                      padding: "0.6rem 1rem", 
                      fontSize: "0.85rem", 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "0.5rem",
                      background: currentCurrency.code === preset.code ? "var(--brand-glow)" : "transparent",
                      border: currentCurrency.code === preset.code ? "1px solid var(--brand-primary)" : "1px solid var(--border-color)",
                      color: currentCurrency.code === preset.code ? "var(--brand-primary)" : "inherit"
                    }}
                  >
                    <span>{preset.flag}</span>
                    <span>{preset.name} ({preset.symbol})</span>
                  </button>
                </form>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
