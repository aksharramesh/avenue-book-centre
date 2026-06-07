import { getCMSContent, updateCMSContent } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CreditCard, Landmark, CheckCircle, Save, ShieldAlert, Sparkles } from "lucide-react";

export const metadata = {
  title: "Payment Gateway Settings | Avenue Book Centre",
  robots: { index: false }
};

export default async function PaymentSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const params = await searchParams;

  // Fetch current payment gateway configuration from CMS variables
  const razorpayActive = (await getCMSContent("payment_razorpay_active")) || "true";
  const razorpayKeyId = (await getCMSContent("payment_razorpay_key_id")) || "rzp_test_AvenueBookCentre59";
  const razorpayKeySecret = (await getCMSContent("payment_razorpay_key_secret")) || "••••••••••••••••••••••••";
  
  const stripeActive = (await getCMSContent("payment_stripe_active")) || "false";
  const stripeKeyPublishable = (await getCMSContent("payment_stripe_key_publishable")) || "pk_test_51OpAvenueBookCentreGlow";
  
  const codActive = (await getCMSContent("payment_cod_active")) || "true";
  const codFee = (await getCMSContent("payment_cod_fee")) || "2.50";

  // Server Action to update settings
  async function savePaymentSettings(formData: FormData) {
    "use server";

    const rzpActive = formData.get("razorpayActive") ? "true" : "false";
    const rzpKey = formData.get("razorpayKeyId") as string;
    const rzpSecret = formData.get("razorpayKeySecret") as string;

    const strpActive = formData.get("stripeActive") ? "true" : "false";
    const strpPublishable = formData.get("stripeKeyPublishable") as string;

    const cashActive = formData.get("codActive") ? "true" : "false";
    const cashFee = formData.get("codFee") as string;

    await updateCMSContent("payment_razorpay_active", rzpActive);
    if (rzpKey) await updateCMSContent("payment_razorpay_key_id", rzpKey.trim());
    if (rzpSecret && rzpSecret !== "••••••••••••••••••••••••") {
      await updateCMSContent("payment_razorpay_key_secret", rzpSecret.trim());
    }

    await updateCMSContent("payment_stripe_active", strpActive);
    if (strpPublishable) await updateCMSContent("payment_stripe_key_publishable", strpPublishable.trim());

    await updateCMSContent("payment_cod_active", cashActive);
    if (cashFee) await updateCMSContent("payment_cod_fee", cashFee.trim());

    revalidatePath("/admin/settings/payment");
    redirect("/admin/settings/payment?success=true");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Header */}
      <div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Payment Gateway Settings</h1>
        <p className="text-muted" style={{ margin: 0 }}>Manage customer transaction gateways, API merchant keys, secure payment thresholds, and local shipping invoice checkout options.</p>
      </div>

      {/* Success notification */}
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
          <span>Payment settings successfully synchronized and deployed! All gateways are active in sandbox mode.</span>
        </div>
      )}

      <form action={savePaymentSettings} style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
          
          {/* Razorpay Gateway */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CreditCard size={20} color="var(--brand-primary)" />
                  Razorpay India Gateway
                </h2>
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>Primary UPI & Netbanking gateway</span>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} aria-label="Toggle Razorpay">
                <input 
                  type="checkbox" 
                  name="razorpayActive" 
                  defaultChecked={razorpayActive === "true"} 
                  style={{ width: "18px", height: "18px", accentColor: "var(--brand-primary)" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>API Key ID</span>
                <input 
                  type="text" 
                  name="razorpayKeyId" 
                  defaultValue={razorpayKeyId} 
                  placeholder="rzp_test_..." 
                  className="input-base" 
                  style={{ width: "100%", fontSize: "0.875rem", padding: "0.6rem 0.8rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>API Key Secret</span>
                <input 
                  type="password" 
                  name="razorpayKeySecret" 
                  defaultValue={razorpayKeySecret} 
                  placeholder="••••••••••••••••••••••••" 
                  className="input-base" 
                  style={{ width: "100%", fontSize: "0.875rem", padding: "0.6rem 0.8rem" }}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <Sparkles size={14} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
              <span>Razorpay checkout handles all UPI, Credit/Debit cards, and INR local netbanking instantly.</span>
            </div>
          </div>

          {/* Stripe Gateway */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Landmark size={20} color="var(--brand-primary)" />
                  Stripe Global Gateway
                </h2>
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>International cards and Apple Pay</span>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} aria-label="Toggle Stripe">
                <input 
                  type="checkbox" 
                  name="stripeActive" 
                  defaultChecked={stripeActive === "true"} 
                  style={{ width: "18px", height: "18px", accentColor: "var(--brand-primary)" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Stripe Publishable Key</span>
                <input 
                  type="text" 
                  name="stripeKeyPublishable" 
                  defaultValue={stripeKeyPublishable} 
                  placeholder="pk_test_..." 
                  className="input-base" 
                  style={{ width: "100%", fontSize: "0.875rem", padding: "0.6rem 0.8rem" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Stripe Secret Key</span>
                <input 
                  type="password" 
                  placeholder="••••••••••••••••••••••••" 
                  disabled
                  className="input-base" 
                  style={{ width: "100%", fontSize: "0.875rem", padding: "0.6rem 0.8rem", background: "var(--bg-tertiary)", cursor: "not-allowed" }}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <ShieldAlert size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
              <span>International cards require Stripe activation. Secret key is encrypted securely in production vault.</span>
            </div>
          </div>

          {/* Cash on Delivery */}
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", margin: "0 0 0.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  📦 Cash on Delivery (COD)
                </h2>
                <span className="text-muted" style={{ fontSize: "0.8rem" }}>Offline delivery fulfillment option</span>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }} aria-label="Toggle COD">
                <input 
                  type="checkbox" 
                  name="codActive" 
                  defaultChecked={codActive === "true"} 
                  style={{ width: "18px", height: "18px", accentColor: "var(--brand-primary)" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>COD Extra Service Surcharge</span>
                <input 
                  type="number" 
                  step="0.01"
                  name="codFee" 
                  defaultValue={codFee} 
                  placeholder="2.50" 
                  className="input-base" 
                  style={{ width: "100%", fontSize: "0.875rem", padding: "0.6rem 0.8rem" }}
                />
              </div>
            </div>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem", alignItems: "center", background: "var(--bg-primary)", padding: "0.75rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-color)" }}>
              <span>COD option enables offline checkouts. Surcharge is appended dynamically on logistics dispatch logs.</span>
            </div>
          </div>

        </div>

        {/* Form submit actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
          <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, borderRadius: "var(--radius-md)" }}>
            <Save size={18} /> Deploy Payment Configuration
          </button>
        </div>

      </form>
    </div>
  );
}
