"use client";

import { useState, useTransition } from "react";
import { 
  Search, Eye, MapPin, Scale, Tag, X, Calendar, User, 
  Package, ShoppingCart, Globe, CreditCard, Mail, 
  MessageSquare, ListTodo, ShieldAlert, Printer, ArrowLeft, Sliders
} from "lucide-react";

interface OrderListTableProps {
  initialOrders: any[];
  currency: { symbol: string; code: string };
  onStatusChange: (orderId: string, status: string, notify?: boolean, comment?: string, trackingNumber?: string, carrier?: string) => Promise<void>;
}

export default function OrderListTable({ initialOrders, currency, onStatusChange }: OrderListTableProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  
  // History form states
  const [historyStatus, setHistoryStatus] = useState("PROCESSING");
  const [historyNotify, setHistoryNotify] = useState(true);
  const [historyComment, setHistoryComment] = useState("");
  const [historyCarrier, setHistoryCarrier] = useState("");
  const [historyTrackingNumber, setHistoryTrackingNumber] = useState("");

  // Filter orders dynamically based on search
  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Status transitions
  const handleStatusUpdate = async (orderId: string, newStatus: string, notify = true, comment = "", trackingNumber = "", carrier = "") => {
    setUpdatingOrderId(orderId);
    startTransition(async () => {
      await onStatusChange(orderId, newStatus, notify, comment, trackingNumber, carrier);
      
      // Update local state to append history log entry and sync instantly
      const updatedOrders = (prev: any[]) => prev.map((o: any) => {
        if (o.id === orderId) {
          let history = [];
          try {
            history = JSON.parse(o.historyLog || "[]");
          } catch (e) {
            history = [];
          }
          
          history.push({
            createdAt: new Date().toISOString(),
            status: newStatus,
            notify,
            comment: comment || `Status updated to ${newStatus}.`
          });
          
          return { 
            ...o, 
            status: newStatus, 
            historyLog: JSON.stringify(history),
            trackingNumber: trackingNumber || o.trackingNumber,
            carrier: carrier || o.carrier
          };
        }
        return o;
      });
      
      setOrders(updatedOrders);
      
      // Sync currently open order details state
      setSelectedOrder((prev: any) => {
        if (prev && prev.id === orderId) {
          let history = [];
          try {
            history = JSON.parse(prev.historyLog || "[]");
          } catch (e) {
            history = [];
          }
          
          history.push({
            createdAt: new Date().toISOString(),
            status: newStatus,
            notify,
            comment: comment || `Status updated to ${newStatus}.`
          });
          
          return { 
            ...prev, 
            status: newStatus, 
            historyLog: JSON.stringify(history),
            trackingNumber: trackingNumber || prev.trackingNumber,
            carrier: carrier || prev.carrier
          };
        }
        return prev;
      });
      
      setUpdatingOrderId(null);
    });
  };

  const handleReviewClick = (order: any) => {
    setSelectedOrder(order);
    setHistoryStatus(order.status);
    setHistoryNotify(true);
    setHistoryComment("");
    setHistoryCarrier(order.carrier || "");
    setHistoryTrackingNumber(order.trackingNumber || "");
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#10b981", label: "Delivered" };
      case "SHIPPED":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#3b82f6", label: "Shipped" };
      case "PROCESSING":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#d97706", label: "Processing" };
      case "CANCELLED":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", label: "Cancelled" };
      default:
        return { bg: "var(--bg-tertiary)", color: "var(--text-muted)", label: status };
    }
  };

  // Safe parsing of JSON history logs
  const getParsedHistory = (logString: string) => {
    try {
      return JSON.parse(logString || "[]");
    } catch (e) {
      return [];
    }
  };

  const handleAddHistorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    
    await handleStatusUpdate(
      selectedOrder.id, 
      historyStatus, 
      historyNotify, 
      historyComment, 
      historyStatus === "SHIPPED" ? historyTrackingNumber : "", 
      historyStatus === "SHIPPED" ? historyCarrier : ""
    );
    setHistoryComment(""); // reset comment textarea on submit
  };

  // ────────────────────────────────────────────────────────
  // OPENCART SALE ORDER INFO VIEW (DEDICATED FULL-PAGE PANEL)
  // ────────────────────────────────────────────────────────
  if (selectedOrder) {
    const sStyle = getStatusStyle(selectedOrder.status);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {/* Top Header Actions Bar */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          background: "#ffffff", 
          padding: "1.25rem 2rem", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--border-color)", 
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)" 
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <ShoppingCart size={24} color="var(--brand-primary)" />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>
                Order Details
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace", display: "block" }}>
                ORDER REFERENCE ID: #{selectedOrder.id.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <button
              onClick={() => {
                const printContent = document.getElementById("opencart-print-area");
                if (printContent) {
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Invoice - ${selectedOrder.id}</title>
                          <style>
                            body { font-family: sans-serif; color: #333; padding: 2rem; }
                            table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
                            th, td { border: 1px solid #ccc; padding: 12px; text-align: left; font-size: 13px; }
                            th { background: #eee; }
                            .header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem; }
                            .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
                            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem; }
                            .box { border: 1px solid #ccc; padding: 1.25rem; border-radius: 8px; font-size: 13px; }
                            h3 { border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 0; font-size: 14px; }
                            .badge { font-weight: bold; text-transform: uppercase; color: #d97706; }
                          </style>
                        </head>
                        <body>
                          <div class="header">
                            <h2>INK & PAPER BOOKSHOP</h2>
                            <p>Premium Novels, Textbooks & Curated Stationery Supplies</p>
                          </div>
                          ${printContent.innerHTML}
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }
              }}
              className="btn btn-outline"
              style={{ padding: "0.5rem 1rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", background: "#ffffff" }}
              title="Print PDF Invoice"
            >
              <Printer size={16} /> Print Invoice
            </button>
            <button
              onClick={() => setSelectedOrder(null)}
              className="btn btn-outline"
              style={{ padding: "0.5rem 1.25rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.85rem", background: "#ffffff", borderColor: "var(--border-color)" }}
            >
              <ArrowLeft size={16} /> Back to Orders List
            </button>
          </div>
        </div>

        {/* Dynamic Telemetry Workspace Wrapper */}
        <div id="opencart-print-area" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Top Info Cards Grid: 3 columns */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
            
            {/* Panel 1: Order Details */}
            <div className="card" style={{ padding: "1.5rem", background: "#ffffff", minHeight: "220px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", color: "var(--text-primary)" }}>
                <Globe size={16} color="var(--brand-primary)" />
                Order Details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem", flexGrow: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Store Name:</span>
                  <strong style={{ color: "var(--text-primary)" }}>Avenue Book Centre Bookshop</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Date Placed:</span>
                  <strong>{new Date(selectedOrder.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Payment Method:</span>
                  <strong>Avenue Pay / Razorpay</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Shipping Method:</span>
                  <strong>
                    {selectedOrder.shippingMethod === "IPS" ? "Indian Postal Service (Speed Post)" : 
                     (selectedOrder.shippingMethod === "PICKUP" ? "Store Pickup Collection" : 
                      (selectedOrder.shippingMethod === "AGGREGATOR" ? "Logistics Aggregator (Express)" : "Flat Rate Standard Express"))}
                  </strong>
                </div>
                {selectedOrder.carrier && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Logistics Carrier:</span>
                    <strong>{selectedOrder.carrier}</strong>
                  </div>
                )}
                {selectedOrder.trackingNumber && (
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-muted)" }}>Tracking ID:</span>
                    <strong style={{ fontFamily: "monospace" }}>{selectedOrder.trackingNumber}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Panel 2: Customer Details */}
            <div className="card" style={{ padding: "1.5rem", background: "#ffffff", minHeight: "220px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", color: "var(--text-primary)" }}>
                <User size={16} color="var(--brand-primary)" />
                Customer Details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem", flexGrow: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Customer Name:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{selectedOrder.customerName}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Customer Group:</span>
                  <strong>Retail B2C Client</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Email Address:</span>
                  <a href={`mailto:${selectedOrder.customerEmail}`} style={{ color: "var(--brand-primary)", textDecoration: "underline", fontWeight: 600 }}>{selectedOrder.customerEmail}</a>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Telephone:</span>
                  <strong>{selectedOrder.shippingAddress.split("Phone:")[1]?.trim() || "Not provided"}</strong>
                </div>
              </div>
            </div>

            {/* Panel 3: Options / Operational */}
            <div className="card" style={{ padding: "1.5rem", background: "#ffffff", minHeight: "220px", display: "flex", flexDirection: "column" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", color: "var(--text-primary)" }}>
                <Sliders size={16} color="var(--brand-primary)" />
                Operational Status
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.85rem", flexGrow: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Invoice ID Reference:</span>
                  <strong style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>#{selectedOrder.id.substring(0, 12).toUpperCase()}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Total Weight:</span>
                  <strong>{selectedOrder.shippingWeight.toFixed(2)} kg</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "var(--text-muted)" }}>Fulfillment State:</span>
                  <span className="badge" style={{
                    padding: "0.35rem 0.6rem",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${sStyle.color}`,
                    background: sStyle.bg,
                    color: sStyle.color,
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textTransform: "uppercase"
                  }}>
                    {sStyle.label}
                  </span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Row 2: Billing & Shipping Address boxes Side-by-Side */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
            
            <div className="card" style={{ padding: "1.5rem", background: "#ffffff" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", color: "var(--text-primary)" }}>
                <CreditCard size={16} color="var(--brand-primary)" />
                Payment Address Billing
              </h3>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>{selectedOrder.customerName}</strong>
                {selectedOrder.shippingAddress.split("Phone:")[0]?.split("ZIP:")[0]?.trim() || selectedOrder.shippingAddress}
              </div>
            </div>

            <div className="card" style={{ padding: "1.5rem", background: "#ffffff" }}>
              <h3 style={{ margin: "0 0 1rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem", color: "var(--text-primary)" }}>
                <MapPin size={16} color="var(--brand-primary)" />
                Shipping Destination Details
              </h3>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--text-secondary)" }}>
                <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>{selectedOrder.customerName}</strong>
                {selectedOrder.shippingAddress}
              </div>
            </div>

          </div>

          {/* Row 3: Products Purchased Table */}
          <div className="card" style={{ padding: "0", overflow: "hidden", background: "#ffffff" }}>
            <div style={{ padding: "1.25rem 2rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={16} color="var(--brand-primary)" />
                Products Registry Table
              </h3>
            </div>
            
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
                    <th style={{ padding: "0.85rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Product Model Details</th>
                    <th style={{ padding: "0.85rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Model SKU</th>
                    <th style={{ padding: "0.85rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "center" }}>Quantity</th>
                    <th style={{ padding: "0.85rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "right" }}>Unit Price</th>
                    <th style={{ padding: "0.85rem 1.5rem", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", textAlign: "right" }}>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <tr key={item.id} style={{ borderBottom: idx < selectedOrder.items.length - 1 ? "1px solid var(--border-color)" : "none", background: "#ffffff" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>
                        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                          {item.product?.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} style={{ width: "36px", height: "45px", objectFit: "cover", borderRadius: "4px" }} />
                          ) : (
                            <div style={{ width: "36px", height: "45px", background: "var(--bg-tertiary)", borderRadius: "4px" }} />
                          )}
                          <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>{item.product?.name || "Deleted Product"}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "1rem 1.5rem", fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-muted)" }}>
                        {item.product?.sku || "N/A"}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontWeight: 600 }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right", color: "var(--text-secondary)" }}>
                        {currency.symbol}{item.price.toFixed(2)}
                      </td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right", fontWeight: 700, color: "var(--text-primary)" }}>
                        {currency.symbol}{(item.price * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Invoice billing breakdown details */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "1.5rem 2rem", borderTop: "1px solid var(--border-color)", background: "var(--bg-tertiary)" }}>
              <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "0.6rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Subtotal:</span>
                  <strong>{currency.symbol}{(selectedOrder.totalAmount - selectedOrder.shippingCost - selectedOrder.taxAmount + (selectedOrder.discountAmount || 0)).toFixed(2)}</strong>
                </div>
                {selectedOrder.discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)" }}>
                    <span>Coupon Savings ({selectedOrder.discountCode}):</span>
                    <strong>-{currency.symbol}{selectedOrder.discountAmount.toFixed(2)}</strong>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Shipping Cost:</span>
                  <strong>{selectedOrder.shippingCost === 0 ? "FREE" : `${currency.symbol}${selectedOrder.shippingCost.toFixed(2)}`}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Sales Tax (8%):</span>
                  <strong>{currency.symbol}{selectedOrder.taxAmount.toFixed(2)}</strong>
                </div>
                <div style={{ height: "1px", background: "var(--border-color)", margin: "0.2rem 0" }}></div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  <span>Order Grand Total:</span>
                  <span style={{ color: "var(--brand-dark)" }}>{currency.symbol}{selectedOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 4: Timeline Logs & Timeline Updates (OpenCart style timeline logs) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.5rem" }}>
            
            {/* Timeline history registry */}
            <div className="card" style={{ padding: "0", overflow: "hidden", background: "#ffffff" }}>
              <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ListTodo size={16} color="var(--brand-primary)" />
                  Fulfillment Timeline History
                </h3>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.825rem" }}>
                  <thead>
                    <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600 }}>Date Added</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600 }}>Fulfillment Status</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600 }}>Notified?</th>
                      <th style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontWeight: 600 }}>Internal Comments / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getParsedHistory(selectedOrder.historyLog).length === 0 ? (
                      <tr>
                        <td colSpan={4} style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
                          No status history logs found.
                        </td>
                      </tr>
                    ) : (
                      getParsedHistory(selectedOrder.historyLog).map((h: any, hIdx: number) => (
                        <tr key={hIdx} style={{ borderBottom: hIdx < getParsedHistory(selectedOrder.historyLog).length - 1 ? "1px solid var(--border-color)" : "none", background: "#ffffff" }}>
                          <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {new Date(h.createdAt).toLocaleDateString("en-IN", { 
                              day: "2-digit", month: "short", 
                              hour: "2-digit", minute: "2-digit" 
                            })}
                          </td>
                          <td style={{ padding: "0.75rem 1rem" }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              color: getStatusStyle(h.status).color
                            }}>
                              {getStatusStyle(h.status).label}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>
                            {h.notify ? (
                              <span style={{ color: "#10b981" }}>✉️ Customer Notified</span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>🔕 Not Sent</span>
                            )}
                          </td>
                          <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                            {h.comment}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add order history form */}
            <div className="card" style={{ padding: "1.5rem", background: "#ffffff" }}>
              <h3 style={{ margin: "0 0 1.25rem 0", fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
                <MessageSquare size={16} color="var(--brand-primary)" />
                Add Order History & Modify Status
              </h3>

              <form onSubmit={handleAddHistorySubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}> FULFILLMENT STATUS</label>
                  <select 
                    value={historyStatus}
                    onChange={(e) => {
                      const val = e.target.value;
                      setHistoryStatus(val);
                      if (val === "SHIPPED") {
                        if (selectedOrder?.shippingMethod === "IPS") {
                          if (!historyCarrier) setHistoryCarrier("Indian Postal Service");
                        } else if (selectedOrder?.shippingMethod === "AGGREGATOR") {
                          if (!historyCarrier) setHistoryCarrier("Logistics Aggregator (Express)");
                        }
                      }
                    }}
                    className="input-base"
                    style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", background: "var(--bg-primary)" }}
                  >
                    <option value="PROCESSING">Processing</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                {historyStatus === "SHIPPED" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem", border: "1px solid var(--border-color)", padding: "1rem", borderRadius: "var(--radius-md)", background: "var(--bg-tertiary)" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-primary)" }}>Shipping Logistics & Tracking Info</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>LOGISTICS CARRIER</label>
                        <input 
                          type="text" 
                          value={historyCarrier} 
                          onChange={(e) => setHistoryCarrier(e.target.value)} 
                          className="input-base" 
                          style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", background: "#ffffff" }} 
                          placeholder="e.g. Indian Postal Service, DHL" 
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>TRACKING ID (AWB)</label>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <input 
                            type="text" 
                            value={historyTrackingNumber} 
                            onChange={(e) => setHistoryTrackingNumber(e.target.value)} 
                            className="input-base" 
                            style={{ width: "100%", padding: "0.5rem 0.75rem", fontSize: "0.85rem", background: "#ffffff" }} 
                            placeholder="e.g. SP123456789IN" 
                          />
                          {selectedOrder?.shippingMethod === "IPS" && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
                                setHistoryTrackingNumber(`SP${randomDigits}IN`);
                              }}
                              className="btn btn-outline"
                              style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", flexShrink: 0 }}
                            >
                              Generate AWB
                            </button>
                          )}
                          {selectedOrder?.shippingMethod === "AGGREGATOR" && (
                            <button 
                              type="button" 
                              onClick={() => {
                                const randomDigits = Math.floor(100000000 + Math.random() * 900000000);
                                setHistoryTrackingNumber(`SR${randomDigits}IN`);
                              }}
                              className="btn btn-outline"
                              style={{ padding: "0.5rem 0.75rem", fontSize: "0.75rem", flexShrink: 0 }}
                            >
                              Generate AWB
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.25rem 0" }}>
                  <input 
                    type="checkbox" 
                    id="historyNotifyCheck"
                    checked={historyNotify}
                    onChange={(e) => setHistoryNotify(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--brand-primary)", cursor: "pointer" }}
                  />
                  <label htmlFor="historyNotifyCheck" style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)", cursor: "pointer" }}>
                    Notify Customer via Simulated Email Dispatch
                  </label>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem" }}>TIMELINE LOG COMMENT / CUSTOMER MEMO</label>
                  <textarea 
                    value={historyComment}
                    onChange={(e) => setHistoryComment(e.target.value)}
                    required
                    placeholder="Enter dispatch tracking numbers, delay notices, or transition comments here..." 
                    rows={4}
                    className="input-base"
                    style={{ width: "100%", fontSize: "0.85rem", fontFamily: "inherit", lineHeight: 1.5 }}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 1.5rem", fontSize: "0.875rem", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
                  >
                    {isPending ? "Updating Log..." : "Append History Log"}
                  </button>
                </div>
              </form>
            </div>

          </div>

        </div>

      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // OPENCART ORDER LIST VIEW
  // ────────────────────────────────────────────────────────
  return (
    <div className="card" style={{ padding: "0", overflow: "hidden" }}>
      {/* Search Toolbar */}
      <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)", background: "#ffffff", display: "flex", gap: "1rem" }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem" }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: "0.5rem" }} />
          <input 
            type="text" 
            placeholder="Search by Order ID, Name, or Email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }} 
          />
        </div>
      </div>

      {/* Orders Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Invoice ID</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Customer Details</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Total Amount</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Date</th>
              <th style={{ padding: "1rem 1.5rem", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Status</th>
              <th style={{ padding: "1rem 1.5rem", textAlign: "right", fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              filteredOrders.map((order, idx) => {
                const sStyle = getStatusStyle(order.status);
                return (
                  <tr key={order.id} className="table-row-hover" style={{ borderBottom: idx < filteredOrders.length - 1 ? "1px solid var(--border-color)" : "none", background: "#ffffff", transition: "background 0.2s" }}>
                    <td style={{ padding: "1.25rem 1.5rem", fontWeight: 700, fontSize: "0.85rem", fontFamily: "monospace", color: "var(--text-secondary)" }}>
                      #{order.id.substring(0, 10).toUpperCase()}...
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{order.customerName}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.customerEmail}</div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", fontWeight: 700, color: "var(--text-primary)" }}>
                      {currency.symbol}{order.totalAmount.toFixed(2)}
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value, true, `Quick-changed status directly from general order table.`)}
                          style={{
                            padding: "0.35rem 0.5rem",
                            borderRadius: "var(--radius-md)",
                            border: `1px solid ${sStyle.color}`,
                            background: sStyle.bg,
                            color: sStyle.color,
                            fontWeight: 600,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            outline: "none"
                          }}
                        >
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>
                    </td>
                    <td style={{ padding: "1.25rem 1.5rem", textAlign: "right" }}>
                      <button 
                        onClick={() => handleReviewClick(order)}
                        className="btn btn-outline" 
                        style={{ padding: "0.4rem 0.65rem", background: "#ffffff", display: "inline-flex", alignItems: "center", gap: "0.25rem", fontSize: "0.8rem" }}
                      >
                        <Eye size={14} /> Review
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
