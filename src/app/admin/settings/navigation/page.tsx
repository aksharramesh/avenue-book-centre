import { getCMSContent, updateCMSContent } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Sliders, Save, ArrowUp, ArrowDown, Layout, HelpCircle, CheckCircle } from "lucide-react";
import NavigationReorderForm from "@/components/NavigationReorderForm";

export const metadata = {
  title: "Navigation Menu Order | Avenue Book Centre",
  robots: { index: false }
};

// Default ordering of the menu items
const DEFAULT_MENU_ORDER = ["dashboard", "reports", "customers", "settings", "products", "categories", "orders"];

export default async function NavigationSettingsPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const params = await searchParams;

  // Fetch current menu order from CMSContent table
  const savedOrderRaw = await getCMSContent("admin_sidebar_menu_order");
  let currentOrder = DEFAULT_MENU_ORDER;

  if (savedOrderRaw) {
    try {
      currentOrder = JSON.parse(savedOrderRaw);
      // Ensure all default items are present (in case of schema updates)
      const missingItems = DEFAULT_MENU_ORDER.filter(item => !currentOrder.includes(item));
      if (missingItems.length > 0) {
        currentOrder = [...currentOrder, ...missingItems];
      }
    } catch (e) {
      currentOrder = DEFAULT_MENU_ORDER;
    }
  }

  // Server Action to save menu order
  async function saveNavigationOrder(orderArray: string[]) {
    "use server";
    await updateCMSContent("admin_sidebar_menu_order", JSON.stringify(orderArray));
    revalidatePath("/admin");
    redirect("/admin/settings/navigation?success=true");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Page Header */}
      <div>
        <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>
          Portal Customization
        </span>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0.25rem 0 0.5rem 0" }}>
          Navigation Menu Order
        </h1>
        <p className="text-muted" style={{ margin: 0 }}>
          Rearrange and sort the administrative sidebar navigation menu items to match your workflow.
        </p>
      </div>

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
          <span>Sidebar menu items re-ordered and deployed successfully! Layout changes are globally active.</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "2rem", alignItems: "start" }}>
        {/* Sorting controls */}
        <NavigationReorderForm initialOrder={currentOrder} saveAction={saveNavigationOrder} />

        {/* Documentation Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <HelpCircle size={18} color="var(--brand-primary)" />
              How Sidebar Customization Works
            </h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", lineHeight: "1.6", margin: 0 }}>
              Adjusting the order here immediately alters the main navigation hierarchy inside the operator dashboard.
            </p>
            <ul style={{ fontSize: "0.85rem", paddingLeft: "1.25rem", margin: 0, color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <li>Use the <strong>Up (▲)</strong> and <strong>Down (▼)</strong> buttons to move links higher or lower in the menu tree.</li>
              <li>The order is stored as a lightweight JSON configuration inside your CMS table.</li>
              <li>The collapsible <strong>Settings dropdown group</strong> will house settings child sub-menus (Tax, Shipping, templates, etc.) wherever it is sorted.</li>
            </ul>
          </div>

          <div style={{ background: "rgba(14, 165, 233, 0.03)", border: "1px dashed var(--border-color)", padding: "1.5rem", borderRadius: "var(--radius-lg)", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <Layout size={20} color="var(--brand-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <strong style={{ display: "block", fontSize: "0.9rem", marginBottom: "0.25rem" }}>Live Sidebar Updates</strong>
              <span className="text-muted" style={{ fontSize: "0.8rem", lineHeight: "1.5" }}>
                Next.js path caching automatically refreshes when order changes are saved, ensuring instant operational coordination.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
