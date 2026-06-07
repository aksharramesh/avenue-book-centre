import { getAllDiscounts, createDiscount, toggleDiscountActive, deleteDiscount, getCurrencySettings } from "@/app/actions";
import { Tag, Plus, Trash2, Calendar, Scale, ToggleLeft, ToggleRight, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DiscountsAdminPage() {
  const [discounts, currency] = await Promise.all([getAllDiscounts(), getCurrencySettings()]);

  // Server Action to add discount coupon
  async function addDiscount(formData: FormData) {
    "use server";
    const code = formData.get("code") as string;
    const type = formData.get("type") as string;
    const value = parseFloat(formData.get("value") as string);
    const minWeight = parseFloat(formData.get("minWeight") as string || "0");
    const expiresAt = formData.get("expiresAt") as string;

    if (!code || !type || isNaN(value) || !expiresAt) return;

    await createDiscount({
      code,
      type,
      value,
      minWeight,
      expiresAt
    });

    redirect("/admin/discounts?success=true");
  }

  // Server Action to toggle discount coupon active state
  async function toggleDiscount(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    const currentActive = formData.get("active") === "true";
    
    if (id) {
      await toggleDiscountActive(id, !currentActive);
    }
    redirect("/admin/discounts?success=true");
  }

  // Server Action to delete discount coupon
  async function removeDiscount(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteDiscount(id);
    }
    redirect("/admin/discounts?deleted=true");
  }

  // Currency format helper (dynamic from admin settings)
  const formatCurrency = (val: number) => {
    return `${currency.symbol}${val.toFixed(2)}`;
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>
            Marketing & Promotions
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Coupons & Discounts
          </h1>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "2rem",
        alignItems: "start"
      }}>
        {/* Creation Card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Plus size={18} color="var(--brand-primary)" />
            Create Promo Coupon
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Mint new customer discount coupons for checkout validations.
          </p>

          <form action={addDiscount} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Promo Code *</label>
              <input type="text" name="code" required placeholder="e.g. SUMMER25" className="input-base" style={{ width: "100%", padding: "0.6rem", textTransform: "uppercase" }} />
            </div>

            <div className="grid-cols-2" style={{ gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Type *</label>
                <select name="type" required className="input-base" style={{ width: "100%", padding: "0.6rem", background: "#ffffff" }}>
                  <option value="PERCENT">Percentage (%)</option>
                  <option value="FLAT">Flat reduction ({currency.symbol})</option>
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Value *</label>
                <input type="number" name="value" required step="0.01" min="0" placeholder="e.g. 15" className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Min Weight (kg)</label>
              <input type="number" name="minWeight" step="0.1" min="0" defaultValue="0" className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Scale size={12} /> Limit coupon eligibility based on total order weight.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Expiration Date *</label>
              <input type="date" name="expiresAt" required className="input-base" style={{ width: "100%", padding: "0.6rem" }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem", fontWeight: 700, width: "100%", marginTop: "0.5rem" }}>
              Save Coupon
            </button>
          </form>
        </div>

        {/* Directory Listing Table */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)",
          flexGrow: 2
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Tag size={18} color="var(--brand-primary)" />
            Active Promo Catalog
          </h3>

          {discounts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              No coupons logged in the database. Use the creator to mint promotional discount codes.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>Promo Code</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>Benefit Value</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>Limitations</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>Expires</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", textAlign: "center" }}>State</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discounts.map((disc) => {
                    const isExpired = new Date(disc.expiresAt) < new Date();
                    const formattedExpiry = new Date(disc.expiresAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric"
                    });

                    return (
                      <tr key={disc.id} style={{ borderBottom: "1px solid var(--border-color)", opacity: isExpired ? 0.6 : 1 }}>
                        {/* Code */}
                        <td style={{ padding: "1rem" }}>
                          <span style={{
                            fontFamily: "monospace",
                            fontWeight: "bold",
                            fontSize: "0.95rem",
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "var(--radius-sm)",
                            color: "var(--text-primary)"
                          }}>
                            {disc.code}
                          </span>
                        </td>

                        {/* Benefit Value */}
                        <td style={{ padding: "1rem", fontWeight: 700, color: "var(--brand-primary)" }}>
                          {disc.type === "PERCENT" ? `${disc.value}% off` : `${formatCurrency(disc.value)} flat`}
                        </td>

                        {/* Limitations */}
                        <td style={{ padding: "1rem", color: "var(--text-secondary)" }}>
                          {disc.minWeight > 0 ? (
                            <span style={{ fontSize: "0.8rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                              <Scale size={12} />
                              &ge; {disc.minWeight} kg
                            </span>
                          ) : (
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                              No weight limit
                            </span>
                          )}
                        </td>

                        {/* Expires */}
                        <td style={{ padding: "1rem", color: isExpired ? "var(--danger)" : "var(--text-secondary)" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "0.8rem" }}>
                            <Calendar size={12} />
                            {formattedExpiry}
                          </div>
                        </td>

                        {/* Active Toggle State */}
                        <td style={{ padding: "1rem", textAlign: "center" }}>
                          <form action={toggleDiscount} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={disc.id} />
                            <input type="hidden" name="active" value={disc.active ? "true" : "false"} />
                            <button
                              type="submit"
                              disabled={isExpired}
                              style={{
                                border: "none",
                                background: "transparent",
                                cursor: isExpired ? "not-allowed" : "pointer",
                                color: disc.active ? "var(--success)" : "var(--text-muted)"
                              }}
                              title={disc.active ? "Deactivate coupon" : "Activate coupon"}
                            >
                              {disc.active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                            </button>
                          </form>
                        </td>

                        {/* Delete Action */}
                        <td style={{ padding: "1rem", textAlign: "right" }}>
                          <form action={removeDiscount} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={disc.id} />
                            <button
                              type="submit"
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "var(--danger)",
                                cursor: "pointer",
                                padding: "0.4rem",
                                borderRadius: "4px"
                              }}
                              title="Delete coupon"
                              aria-label={`Delete coupon ${disc.code}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
