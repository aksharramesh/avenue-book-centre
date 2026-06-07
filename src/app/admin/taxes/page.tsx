import { getTaxAnalytics, updateCMSContent, getCurrencySettings, getTaxRules, saveTaxRules } from "@/app/actions";
import { Percent, Scale, DollarSign, RefreshCw, BarChart2, ShieldAlert, Award, Save, Trash2, Tag, Layers } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import TaxOverrideForm from "@/components/TaxOverrideForm";

export const dynamic = "force-dynamic";

export default async function TaxesAdminPage() {
  const [data, currency, categories, products, taxRulesData] = await Promise.all([
    getTaxAnalytics(),
    getCurrencySettings(),
    prisma.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ select: { id: true, name: true, sku: true }, orderBy: { name: "asc" } }),
    getTaxRules()
  ]);

  if (!data) {
    return (
      <div style={{
        padding: "2rem",
        background: "#ffffff",
        border: "1px solid var(--border-color)",
        borderRadius: "var(--radius-lg)",
        textAlign: "center"
      }}>
        <ShieldAlert size={48} color="var(--danger)" style={{ margin: "0 auto 1rem auto" }} />
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Failed to Load Tax Subsystem</h2>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
          Database telemetry is offline.
        </p>
        <Link href="/admin" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { stats, rules } = data;
  const { globalRate, rules: customRules } = taxRulesData;

  // Server Action to update tax rate in database
  async function saveTaxRate(formData: FormData) {
    "use server";
    const taxRate = formData.get("taxRate") as string;
    if (!taxRate) return;

    await updateCMSContent("tax_rate", taxRate.trim());
    revalidatePath("/admin/taxes");
    redirect("/admin/taxes?success=true");
  }

  // Server Action to create customized tax rules
  async function addTaxRule(formData: FormData) {
    "use server";
    const targetType = formData.get("targetType") as "PRODUCT" | "CATEGORY";
    const targetId = formData.get("targetId") as string;
    const type = formData.get("type") as "PERCENT" | "AMOUNT";
    const value = parseFloat(formData.get("value") as string);

    if (!targetId || isNaN(value)) return;

    let targetName = "";
    if (targetType === "PRODUCT") {
      const p = await prisma.product.findUnique({ where: { id: targetId }, select: { name: true } });
      targetName = p ? p.name : "Product";
    } else {
      const c = await prisma.category.findUnique({ where: { id: targetId }, select: { name: true } });
      targetName = c ? c.name : "Category";
    }

    const { rules: currentRules } = await getTaxRules();
    
    // De-duplicate if existing rule for target matches
    const filteredRules = currentRules.filter(r => !(r.targetType === targetType && r.targetId === targetId));

    const newRule = {
      id: Math.random().toString(36).substring(2, 9),
      targetType,
      targetId,
      targetName,
      type,
      value
    };

    filteredRules.push(newRule);
    await saveTaxRules(JSON.stringify(filteredRules));
    
    revalidatePath("/admin/taxes");
    redirect("/admin/taxes?success=true");
  }

  // Server Action to delete a tax override rule
  async function deleteTaxRuleAction(formData: FormData) {
    "use server";
    const ruleId = formData.get("ruleId") as string;
    if (!ruleId) return;

    const { rules: currentRules } = await getTaxRules();
    const filteredRules = currentRules.filter(r => r.id !== ruleId);

    await saveTaxRules(JSON.stringify(filteredRules));
    
    revalidatePath("/admin/taxes");
    redirect("/admin/taxes?deleted=true");
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return `${currency.symbol}${val.toFixed(2)}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>
            Operational Control
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Tax & Custom Rates Settings
          </h1>
        </div>

        <Link 
          href="/admin/taxes" 
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", padding: "0.5rem 1rem" }}
        >
          <RefreshCw size={14} />
          Refresh rules
        </Link>
      </div>

      {/* Analytics KPI Row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem"
      }}>
        {/* Total tax collected */}
        <div className="card" style={{ padding: "1.5rem 2rem", position: "relative", overflow: "hidden", background: "#ffffff" }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, color: "var(--brand-primary)" }}>
            <DollarSign size={80} />
          </div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
            Cumulative Tax Collected
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0", color: "var(--brand-primary)" }}>
            {formatCurrency(stats.totalTaxCollected)}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Total tax revenues collected at checkout
          </p>
        </div>

        {/* Average tax per order */}
        <div className="card" style={{ padding: "1.5rem 2rem", position: "relative", overflow: "hidden", background: "#ffffff" }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, color: "var(--text-primary)" }}>
            <BarChart2 size={80} />
          </div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
            Average Tax / Order
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0", color: "var(--text-primary)" }}>
            {formatCurrency(stats.averageTaxPerOrder)}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Average tax invoice charge per checkout
          </p>
        </div>

        {/* Total Order Revenue */}
        <div className="card" style={{ padding: "1.5rem 2rem", position: "relative", overflow: "hidden", background: "#ffffff" }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, color: "var(--text-primary)" }}>
            <Scale size={80} />
          </div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
            Gross Lifetime Sales
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: "0.25rem 0", color: "var(--text-primary)" }}>
            {formatCurrency(stats.totalOrderRevenue)}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Aggregated gross order values delivered
          </p>
        </div>
      </div>

      {/* Global tax settings and override creator grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "2rem",
        alignItems: "start"
      }}>
        {/* Rules Configurator */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Percent size={18} color="var(--brand-primary)" />
            Configure Global Tax Rate
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Adjust the checkout sales tax rate percentage instantly for items without custom overrides.
          </p>

          <form action={saveTaxRate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Global Active Tax Rate (%) *</label>
              <input type="number" name="taxRate" required step="0.1" min="0" max="100" defaultValue={globalRate} className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Calculated post-coupon on item lines that do not match category/product rules.
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem", fontWeight: 700, width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", marginTop: "0.5rem" }}>
              <Save size={16} />
              Save Global Tax Rate
            </button>
          </form>
        </div>

        {/* Override creation card */}
        <TaxOverrideForm 
          categories={categories} 
          products={products} 
          currencySymbol={currency.symbol}
          addRuleAction={addTaxRule}
        />
      </div>

      {/* Customized Rules Directory listing */}
      <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
        <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={18} color="var(--brand-primary)" />
          Customized Tax Overrides Directory
        </h3>
        <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
          Manage dynamic category- and product-level tax surcharge rules. High-priority overrides intercept the global tax rates cleanly.
        </p>

        {customRules.length === 0 ? (
          <div style={{ 
            padding: "2rem", 
            border: "1px dashed var(--border-color)", 
            borderRadius: "var(--radius-md)", 
            textAlign: "center" 
          }}>
            <span className="text-muted" style={{ fontSize: "0.9rem" }}>No category- or product-level custom tax overrides are currently defined.</span>
          </div>
        ) : (
          <div className="tableContainer" style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)" }}>
            <table className="adminTable" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)" }}>
                  <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", textShadow: "none" }}>Target</th>
                  <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", textShadow: "none" }}>Binding Target Name</th>
                  <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", textShadow: "none" }}>Tax Type</th>
                  <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", textShadow: "none" }}>Value</th>
                  <th style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-secondary)", textShadow: "none", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customRules.map((rule: any) => (
                  <tr key={rule.id} style={{ borderTop: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.875rem" }}>
                      <span className={`badge ${rule.targetType === "PRODUCT" ? "badge-primary" : "badge-secondary"}`} style={{
                        background: rule.targetType === "PRODUCT" ? "rgba(2, 132, 199, 0.1)" : "rgba(75, 85, 99, 0.1)",
                        color: rule.targetType === "PRODUCT" ? "var(--brand-primary)" : "var(--text-secondary)",
                        fontWeight: 700,
                        border: "none"
                      }}>
                        {rule.targetType}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.875rem", fontWeight: 600 }}>{rule.targetName}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.875rem" }}>{rule.type === "PERCENT" ? "Percentage (%)" : "Flat Surcharge (₹)"}</td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.875rem", fontWeight: 700, color: "var(--brand-dark)" }}>
                      {rule.type === "PERCENT" ? `${rule.value}%` : formatCurrency(rule.value)}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontSize: "0.875rem", textAlign: "right" }}>
                      <form action={deleteTaxRuleAction} style={{ display: "inline" }}>
                        <input type="hidden" name="ruleId" value={rule.id} />
                        <button 
                          type="submit" 
                          className="btn btn-outline btnSmall" 
                          style={{ color: "var(--danger)", border: "1px solid rgba(239,68,68,0.15)", background: "rgba(239,68,68,0.03)", padding: "0.3rem 0.6rem" }}
                        >
                          <Trash2 size={13} style={{ marginRight: "0.25rem", verticalAlign: "middle" }} />
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Callout */}
      <div className="card" style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        padding: "1.5rem 2rem",
        borderRadius: "var(--radius-lg)",
        color: "var(--text-secondary)",
        fontSize: "0.9rem",
        lineHeight: 1.7
      }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.75rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Award size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
          How Itemized Invoicing Taxes Compile
        </h3>
        <p style={{ margin: 0 }}>
          The active itemized engine loops through each book in the customer's cart:
        </p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <li>Checks if a specific <strong>Product Override</strong> exists (e.g. flat ₹20 or 15% rate).</li>
          <li>If not, checks if a <strong>Category Override</strong> exists (e.g. 18% rate on Fiction, free tax on Textbooks).</li>
          <li>Falls back to the <strong>Global Active Tax Rate</strong> if no custom settings exist for the book.</li>
          <li>Scales calculated rates proportionally by the coupon reduction ratio, assuring that coupons reduce absolute sales taxes seamlessly.</li>
        </ul>
      </div>
    </div>
  );
}
