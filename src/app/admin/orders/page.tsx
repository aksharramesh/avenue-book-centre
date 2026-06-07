import { getAllOrdersAdmin, getCurrencySettings, updateOrderStatus } from "@/app/actions";
import { revalidatePath } from "next/cache";
import { ShoppingCart, Eye, Package, Calendar, MapPin, Scale, ShieldAlert, CheckCircle, RefreshCw } from "lucide-react";
import OrderListTable from "./OrderListTable";

export const metadata = {
  title: "Order Management | Avenue Book Centre Operations",
  robots: { index: false }
};

export default async function AdminOrdersPage() {
  const orders = await getAllOrdersAdmin();
  const currency = await getCurrencySettings();

  // Server action to update status directly from server component context
  async function handleStatusChange(orderId: string, status: string, notify?: boolean, comment?: string, trackingNumber?: string, carrier?: string) {
    "use server";
    await updateOrderStatus(orderId, status, notify, comment, trackingNumber, carrier);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Title Block */}
      <div>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>Order Management</h1>
        <p className="text-muted" style={{ margin: 0 }}>Review, dispatch, track, and manage all customer storefront orders and retail delivery dispatches.</p>
      </div>

      {/* KPI Stats Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--brand-primary)" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Total Invoices</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>{orders.length}</h3>
        </div>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #f59e0b" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Processing Orders</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            {orders.filter(o => o.status === "PROCESSING").length}
          </h3>
        </div>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #3b82f6" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Shipped Parcels</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            {orders.filter(o => o.status === "SHIPPED").length}
          </h3>
        </div>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Delivered Shipments</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>
            {orders.filter(o => o.status === "DELIVERED").length}
          </h3>
        </div>
      </div>

      {/* Main Order Directory Table */}
      <OrderListTable 
        initialOrders={orders} 
        currency={currency} 
        onStatusChange={handleStatusChange} 
      />
    </div>
  );
}
