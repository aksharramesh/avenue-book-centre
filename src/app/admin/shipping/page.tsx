import { getShippingAnalytics, updateCMSContent, getCurrencySettings } from "@/app/actions";
import { Truck, Scale, DollarSign, RefreshCw, BarChart2, ShieldAlert, Award, Save } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ShippingAdminPage() {
  const [data, currency] = await Promise.all([getShippingAnalytics(), getCurrencySettings()]);

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
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Failed to Load Shipping Subsystem</h2>
        <p className="text-muted" style={{ marginBottom: "1.5rem" }}>
          Database telemetry is offline.
        </p>
        <Link href="/admin" className="btn btn-primary">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const { stats, rules, ipsRules, aggregatorRules } = data;

  // Server Action to update rules in database
  async function saveShippingRules(formData: FormData) {
    "use server";
    const freeThreshold = formData.get("freeThreshold") as string;
    const baseCost = formData.get("baseCost") as string;
    const additionalCost = formData.get("additionalCost") as string;
    const baseWeight = formData.get("baseWeight") as string;

    const ipsEnabled = formData.get("ipsEnabled") === "on" ? "true" : "false";
    const ipsFreeThreshold = formData.get("ipsFreeThreshold") as string;
    const ipsRatesLocal = formData.get("ipsRatesLocal") as string;
    const ipsRatesState = formData.get("ipsRatesState") as string;
    const ipsRatesNational = formData.get("ipsRatesNational") as string;

    const aggEnabled = formData.get("aggEnabled") === "on" ? "true" : "false";
    const aggProvider = formData.get("aggProvider") as string;
    const aggApiKey = formData.get("aggApiKey") as string;
    const aggApiSecret = formData.get("aggApiSecret") as string;
    const aggBaseCost = formData.get("aggBaseCost") as string;
    const aggPerKgCost = formData.get("aggPerKgCost") as string;
    const aggFreeThreshold = formData.get("aggFreeThreshold") as string;

    if (freeThreshold && baseCost && additionalCost && baseWeight) {
      await updateCMSContent("shipping_free_threshold", freeThreshold.trim());
      await updateCMSContent("shipping_base_cost", baseCost.trim());
      await updateCMSContent("shipping_additional_kg_cost", additionalCost.trim());
      await updateCMSContent("shipping_base_weight", baseWeight.trim());
    }

    if (ipsFreeThreshold && ipsRatesLocal && ipsRatesState && ipsRatesNational) {
      await updateCMSContent("shipping_ips_enabled", ipsEnabled);
      await updateCMSContent("shipping_ips_free_threshold", ipsFreeThreshold.trim());
      await updateCMSContent("shipping_ips_rates_local", ipsRatesLocal.trim());
      await updateCMSContent("shipping_ips_rates_state", ipsRatesState.trim());
      await updateCMSContent("shipping_ips_rates_national", ipsRatesNational.trim());
    }

    if (aggProvider && aggBaseCost && aggPerKgCost && aggFreeThreshold) {
      await updateCMSContent("shipping_aggregator_enabled", aggEnabled);
      await updateCMSContent("shipping_aggregator_provider", aggProvider.trim());
      await updateCMSContent("shipping_aggregator_api_key", (aggApiKey || "").trim());
      await updateCMSContent("shipping_aggregator_api_secret", (aggApiSecret || "").trim());
      await updateCMSContent("shipping_aggregator_base_cost", aggBaseCost.trim());
      await updateCMSContent("shipping_aggregator_per_kg_cost", aggPerKgCost.trim());
      await updateCMSContent("shipping_aggregator_free_threshold", aggFreeThreshold.trim());
    }

    redirect("/admin/shipping?success=true");
  }

  const formatCurrency = (val: number) => {
    return `${currency.symbol}${val.toFixed(2)}`;
  };

  const isIpsActive = ipsRules?.enabled !== "false";

  return (
    <div>
      {/* Page Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "2rem",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>
            Operational Control
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Shipping Settings
          </h1>
        </div>

        <Link 
          href="/admin/shipping" 
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
        gap: "1.5rem",
        marginBottom: "3rem"
      }}>
        {/* Total shipping collected */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, color: "var(--brand-primary)" }}>
            <DollarSign size={80} />
          </div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
            Delivered Shipping Revenue
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--brand-primary)" }}>
            {formatCurrency(stats.totalShippingCollected)}
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Total delivery charges collected at checkout
          </p>
        </div>

        {/* Total Shipped weight */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, color: "var(--text-primary)" }}>
            <Scale size={80} />
          </div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
            Total Weight Shipped
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
            {stats.totalShippingWeight.toFixed(2)} kg
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Cumulative weight delivered across all parcels
          </p>
        </div>

        {/* Average parcel weight */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          padding: "1.5rem 2rem",
          borderRadius: "var(--radius-lg)",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <div style={{ position: "absolute", right: "-10px", bottom: "-10px", opacity: 0.05, color: "var(--text-primary)" }}>
            <BarChart2 size={80} />
          </div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
            Average Package Weight
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "var(--text-primary)" }}>
            {stats.averageShippingWeight.toFixed(2)} kg
          </h2>
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
            Average package weight per completed order
          </p>
        </div>
      </div>

      <form action={saveShippingRules}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: "2rem",
          alignItems: "start",
          marginBottom: "2rem"
        }}>


          {/* Indian Postal Service (Speed Post) Rules */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Truck size={18} color="var(--brand-secondary)" />
                Indian Postal Service
              </h3>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" name="ipsEnabled" defaultChecked={isIpsActive} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                Enabled
              </label>
            </div>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Configure weight-based tiers (similar to OpenCart) for Speed Post delivery method.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Free IPS Shipping Threshold ({currency.symbol}) *</label>
                <input type="number" name="ipsFreeThreshold" required step="0.01" min="0" defaultValue={ipsRules.freeThreshold} className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Orders with subtotals exceeding this limit receive free Speed Post shipping.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>Local Speed Post Rates (Within Mumbai) *</label>
                  <input type="text" name="ipsRatesLocal" required defaultValue={ipsRules.ratesLocal} className="input-base" style={{ width: "100%", padding: "0.6rem" }} placeholder="e.g. 0.5:20.00,1:30.00,2:50.00" />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Tiers for Local region (starts with PIN code 400). Format: <code>Weight:Cost,Weight:Cost</code>
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>State Speed Post Rates (Within Maharashtra) *</label>
                  <input type="text" name="ipsRatesState" required defaultValue={ipsRules.ratesState} className="input-base" style={{ width: "100%", padding: "0.6rem" }} placeholder="e.g. 0.5:30.00,1:50.00,2:80.00" />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Tiers for State region (starts with PIN codes 40-44). Format: <code>Weight:Cost,Weight:Cost</code>
                  </span>
                </div>

                <div>
                  <label style={{ fontSize: "0.875rem", fontWeight: 600, display: "block", marginBottom: "0.25rem" }}>National Speed Post Rates (Rest of India) *</label>
                  <input type="text" name="ipsRatesNational" required defaultValue={ipsRules.ratesNational} className="input-base" style={{ width: "100%", padding: "0.6rem" }} placeholder="e.g. 0.5:40.00,1:70.00,2:120.00" />
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Tiers for National region (other PIN codes). Format: <code>Weight:Cost,Weight:Cost</code>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Aggregator Settings Card */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Award size={18} color="var(--brand-primary)" />
                Logistics Aggregators
              </h3>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                <input type="checkbox" name="aggEnabled" defaultChecked={aggregatorRules?.enabled !== "false"} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                Enabled
              </label>
            </div>
            <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
              Configure API integrations with Shiprocket or ClickPost for dynamic express shipping rates.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Active Provider *</label>
                <select name="aggProvider" defaultValue={aggregatorRules?.provider || "Shiprocket"} className="input-base" style={{ width: "100%", padding: "0.6rem", background: "var(--bg-primary)" }}>
                  <option value="Shiprocket">Shiprocket API</option>
                  <option value="ClickPost">ClickPost Enterprise</option>
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>API Client Key *</label>
                <input type="text" name="aggApiKey" defaultValue={aggregatorRules?.apiKey} className="input-base" style={{ width: "100%", padding: "0.6rem" }} placeholder="e.g. shiprocket_client_key_123" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>API Secret / Token *</label>
                <input type="password" name="aggApiSecret" defaultValue={aggregatorRules?.apiSecret} className="input-base" style={{ width: "100%", padding: "0.6rem" }} placeholder="••••••••••••••••" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Base Package Cost ({currency.symbol}) *</label>
                <input type="number" name="aggBaseCost" required step="0.01" min="0" defaultValue={aggregatorRules?.baseCost || "60.00"} className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Standard rate applied for parcels up to 1.0 kg.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Additional Per-kg Cost ({currency.symbol}) *</label>
                <input type="number" name="aggPerKgCost" required step="0.01" min="0" defaultValue={aggregatorRules?.perKgCost || "20.00"} className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Surcharge added per kilogram for packages exceeding 1.0 kg.
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Free Aggregator Threshold ({currency.symbol}) *</label>
                <input type="number" name="aggFreeThreshold" required step="0.01" min="0" defaultValue={aggregatorRules?.freeThreshold || "200.00"} className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Orders with subtotals exceeding this value receive free express courier shipping.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Save Button */}
        <button type="submit" className="btn btn-primary" style={{ padding: "1rem", fontWeight: 700, width: "100%", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center", marginBottom: "3rem", fontSize: "1rem" }}>
          <Save size={18} />
          Save All Shipping Configurations
        </button>
      </form>

      {/* Shipping Details Callout Info boxes */}
      <div style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        padding: "2rem",
        borderRadius: "var(--radius-lg)",
        color: "var(--text-secondary)",
        fontSize: "0.9rem",
        lineHeight: 1.7
      }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Award size={18} color="var(--brand-primary)" />
          Understanding Dynamic Rates Calculation
        </h3>
        <p>
          The system aggregates order items total weight at checkout.
        </p>
        <ul style={{ paddingLeft: "1.25rem", margin: "0.5rem 0" }}>
          <li><strong>Free Shipping</strong>: If order total exceeds the free shipping threshold for the selected method, the delivery fee is set to <strong>{currency.symbol}0.00</strong>.</li>
          <li><strong>Weight-Based Rates</strong>: Calculated dynamically using standard OpenCart weight:cost tiers (e.g. 1:50.00, 2:80.00 means up to 1kg is ₹50.00, up to 2kg is ₹80.00, etc.).</li>
          <li><strong>Logistics Aggregator</strong>: Calculated dynamically as a base cost plus an additional per-kg surcharge (e.g. via Shiprocket or ClickPost).</li>
          <li><strong>Store Pickup</strong>: If selected by the user, all shipping costs are completely bypassed and set to <strong>{currency.symbol}0.00</strong>.</li>
        </ul>
      </div>
    </div>
  );
}
