"use client";

import { useState, useTransition } from "react";
import { trackOrder } from "@/app/actions";
import { 
  Search, MapPin, Truck, Calendar, Package, Clock, CheckCircle2, 
  AlertTriangle, Copy, Check, ArrowRight, ShieldCheck, ShoppingCart 
} from "lucide-react";
import Link from "next/link";

export default function PublicTrackingPage() {
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setError("");
    setResult(null);

    startTransition(async () => {
      const res = await trackOrder(query.trim());
      if (res.error) {
        setError(res.error);
      } else if (res.success && res.order) {
        setResult(res.order);
      }
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return { color: "#10b981", bg: "rgba(16, 185, 129, 0.08)", border: "rgba(16, 185, 129, 0.2)" };
      case "SHIPPED": return { color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.08)", border: "rgba(14, 165, 233, 0.2)" };
      case "PROCESSING": return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.2)" };
      case "CANCELLED": return { color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.2)" };
      default: return { color: "#6b7280", bg: "rgba(107, 114, 128, 0.08)", border: "rgba(107, 114, 128, 0.2)" };
    }
  };

  const getShippingLabel = (method: string) => {
    switch (method) {
      case "IPS": return "Indian Postal Service (Speed Post)";
      case "PICKUP": return "Store Pickup Collection (Self-collect)";
      case "AGGREGATOR": return "Logistics Aggregator (Express Courier)";
      default: return "Flat Rate Standard Express";
    }
  };

  // Generate simulated checkpoints for Indian Postal Service
  const getSimulatedIpsLogs = (order: any) => {
    const logs = [];
    const date = new Date(order.createdAt);
    
    // Checkpoint 1: Booking
    logs.push({
      time: new Date(date.getTime() + 4 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      location: "Avenue Book Centre Local Post Office (EMS Counter)",
      status: "Item Booked & Dispatched",
      details: `EMS Speed Post Article under AWB ${order.trackingNumber || 'N/A'}`
    });

    // Checkpoint 2: Sorting Hub
    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      logs.push({
        time: new Date(date.getTime() + 14 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: "National Sorting Hub (NSH - EMS Division)",
        status: "Processed & Forwarded",
        details: "Bagged and loaded into transit transport vector."
      });
    }

    // Checkpoint 3: Destination Center
    if (order.status === "DELIVERED") {
      logs.push({
        time: new Date(date.getTime() + 28 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: "Destination EMS Speed Post Hub",
        status: "Received at Delivery Hub",
        details: "Dispatched to local beat postman."
      });
      
      logs.push({
        time: new Date(date.getTime() + 32 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: "Local Delivery Office",
        status: "Out for Delivery",
        details: "Article out with beat postman for distribution."
      });

      logs.push({
        time: new Date(date.getTime() + 34 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: order.shippingAddress.split(",")[0] || "Delivery Address",
        status: "Delivered Successfully",
        details: "Item delivered. Recipient signature recorded at sorting terminal."
      });
    }

    return logs.reverse(); // Newest first
  };

  const getSimulatedAggregatorLogs = (order: any) => {
    const logs = [];
    const date = new Date(order.createdAt);
    
    // Checkpoint 1: Booking
    logs.push({
      time: new Date(date.getTime() + 2 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      location: "Avenue Book Centre Warehouse",
      status: "Manifest Created & Package Handed Over",
      details: `AWB assigned: ${order.trackingNumber || 'N/A'}`
    });

    // Checkpoint 2: Sorting Hub
    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      logs.push({
        time: new Date(date.getTime() + 8 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: "Logistics Partner Sort Facility",
        status: "In Transit",
        details: "Package processed at sorting hub."
      });
    }

    // Checkpoint 3: Destination Center
    if (order.status === "DELIVERED") {
      logs.push({
        time: new Date(date.getTime() + 18 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: "Destination Delivery Hub",
        status: "Arrived at Destination Station",
        details: "Package received at delivery facility."
      });
      
      logs.push({
        time: new Date(date.getTime() + 22 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: "Local Hub",
        status: "Out for Delivery",
        details: "Courier partner executive is out for delivery."
      });

      logs.push({
        time: new Date(date.getTime() + 24 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
        location: order.shippingAddress.split(",")[0] || "Delivery Address",
        status: "Delivered",
        details: "Shipment delivered to customer."
      });
    }

    return logs.reverse(); // Newest first
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "4rem 0 6rem 0" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        
        {/* Tracking Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            letterSpacing: "0.15em", 
            color: "var(--brand-primary)", 
            fontWeight: 800,
            background: "var(--brand-glow)",
            padding: "0.4rem 1rem",
            borderRadius: "20px"
          }}>
            Package Logistics Trace
          </span>
          <h1 style={{ 
            fontSize: "2.75rem", 
            fontWeight: 800, 
            marginTop: "1rem", 
            marginBottom: "0.75rem",
            letterSpacing: "-0.03em"
          }}>
            Live Order Tracking
          </h1>
          <p className="text-muted" style={{ maxWidth: "500px", margin: "0 auto", fontSize: "0.95rem" }}>
            Enter your Avenue Book Centre Invoice ID or logistics tracking code to trace your curriculum books and novels.
          </p>
        </div>

        {/* Tracking Search Input Card */}
        <div className="card" style={{ padding: "2rem", marginBottom: "2rem", border: "1px solid var(--border-color)", boxShadow: "0 10px 30px rgba(0,0,0,0.02)" }}>
          <form onSubmit={handleTrackSubmit} style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ 
              flex: 1, 
              display: "flex", 
              alignItems: "center", 
              background: "var(--bg-tertiary)", 
              border: "1px solid var(--border-color)", 
              borderRadius: "var(--radius-md)", 
              padding: "0.75rem 1.2rem",
              minWidth: "260px"
            }}>
              <Search size={18} color="var(--text-muted)" style={{ marginRight: "0.75rem" }} />
              <input 
                type="text" 
                placeholder="Enter Order ID (e.g. clx...) or Tracking Number (e.g. SP...)" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.9rem", color: "var(--text-primary)" }} 
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={isPending}
              className="btn btn-primary"
              style={{ 
                padding: "0.75rem 2rem", 
                fontWeight: 700, 
                display: "inline-flex", 
                alignItems: "center", 
                gap: "0.5rem",
                boxShadow: "0 6px 20px rgba(14,165,233,0.15)"
              }}
            >
              {isPending ? "Locating..." : "Track Package"}
              <ArrowRight size={16} />
            </button>
          </form>

          {error && (
            <div style={{ 
              marginTop: "1.25rem", 
              display: "flex", 
              alignItems: "center", 
              gap: "0.5rem", 
              color: "var(--danger)", 
              background: "rgba(239, 68, 68, 0.05)",
              border: "1px solid rgba(239, 68, 68, 0.15)",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              fontSize: "0.85rem"
            }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Tracking Details View */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            
            {/* Summary Top Card */}
            <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-color)", position: "relative" }}>
              
              {/* Status Badge Top Right */}
              {(() => {
                const s = getStatusColor(result.status);
                return (
                  <div style={{ 
                    position: "absolute", 
                    right: "2rem", 
                    top: "2rem",
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    color: s.color,
                    padding: "0.4rem 1rem",
                    borderRadius: "20px",
                    fontWeight: 700,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    {result.status}
                  </div>
                );
              })()}

              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, margin: "0 0 1.25rem 0", color: "var(--text-primary)" }}>
                Order #{result.id.substring(0, 14).toUpperCase()}...
              </h2>

              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
                gap: "1.5rem",
                borderTop: "1px solid var(--border-color)",
                paddingTop: "1.25rem",
                fontSize: "0.85rem"
              }}>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Collection / Carrier</span>
                  <strong style={{ color: "var(--text-primary)" }}>{getShippingLabel(result.shippingMethod)}</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Date Ordered</span>
                  <strong style={{ color: "var(--text-primary)" }}>
                    {new Date(result.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
                  </strong>
                </div>
                {result.trackingNumber && (
                  <div>
                    <span style={{ color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Tracking Airway Bill</span>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                      <code style={{ fontWeight: 700, color: "var(--brand-primary)" }}>{result.trackingNumber}</code>
                      <button 
                        onClick={() => handleCopy(result.trackingNumber)} 
                        style={{ border: "none", background: "transparent", cursor: "pointer", display: "inline-flex", padding: 0 }}
                        title="Copy tracking code"
                      >
                        {copied ? <Check size={12} color="var(--success)" /> : <Copy size={12} color="var(--text-muted)" />}
                      </button>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Visual Tracking Progress Timeline */}
            <div className="card" style={{ padding: "2.5rem 2rem", border: "1px solid var(--border-color)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 2rem 0" }}>Fulfillment Progress Timeline</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                
                {/* Step 1: Order Placed */}
                <div style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{ 
                      width: "32px", 
                      height: "32px", 
                      borderRadius: "50%", 
                      background: "var(--success)", 
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 2
                    }}>
                      ✓
                    </div>
                    <div style={{ width: "2px", flexGrow: 1, background: "var(--success)", minHeight: "50px", zIndex: 1 }}></div>
                  </div>
                  <div style={{ paddingBottom: "2rem" }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>Order Placed & Confirmed</h4>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {new Date(result.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>

                {/* Step 2: Processing */}
                {(() => {
                  const isDone = ["PROCESSING", "SHIPPED", "DELIVERED"].includes(result.status);
                  const isCurrent = result.status === "PROCESSING";
                  return (
                    <div style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          background: isDone ? "var(--success)" : "var(--border-color)", 
                          color: isDone ? "#ffffff" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                          fontSize: "0.85rem",
                          fontWeight: 700
                        }}>
                          {isCurrent ? <Clock size={16} style={{ animation: "pulse 1.5s infinite" }} /> : (isDone ? "✓" : "2")}
                        </div>
                        <div style={{ 
                          width: "2px", 
                          flexGrow: 1, 
                          background: ["SHIPPED", "DELIVERED"].includes(result.status) ? "var(--success)" : "var(--border-color)", 
                          minHeight: "50px", 
                          zIndex: 1 
                        }}></div>
                      </div>
                      <div style={{ paddingBottom: "2rem" }}>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", fontWeight: 700, color: isDone ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {result.shippingMethod === "PICKUP" ? "Preparing at Counter" : "Packing & Processing"}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {result.shippingMethod === "PICKUP" 
                            ? "Staff verifying items and packing your custom bundle."
                            : "Invoice verified. Preparing books in our warehouse."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* Step 3: Shipped / Ready for Pickup */}
                {(() => {
                  const isDone = ["SHIPPED", "DELIVERED"].includes(result.status);
                  const isCurrent = result.status === "SHIPPED";
                  const isPickup = result.shippingMethod === "PICKUP";
                  
                  return (
                    <div style={{ display: "flex", gap: "1.5rem", position: "relative" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          background: isDone ? "var(--success)" : "var(--border-color)", 
                          color: isDone ? "#ffffff" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                          fontSize: "0.85rem",
                          fontWeight: 700
                        }}>
                          {isCurrent ? <Clock size={16} /> : (isDone ? "✓" : "3")}
                        </div>
                        <div style={{ 
                          width: "2px", 
                          flexGrow: 1, 
                          background: result.status === "DELIVERED" ? "var(--success)" : "var(--border-color)", 
                          minHeight: "50px", 
                          zIndex: 1 
                        }}></div>
                      </div>
                      <div style={{ paddingBottom: "2rem" }}>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", fontWeight: 700, color: isDone ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {isPickup ? "Ready for Collection" : "Dispatched / In Transit"}
                        </h4>
                        <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {isPickup 
                            ? "Items verified and ready at counter. Please visit the store for collection."
                            : `Handed over to carrier${result.carrier ? ` (${result.carrier})` : ""}.`}
                        </p>

                        {/* Store Pickup Address Block */}
                        {isPickup && isDone && (
                          <div style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border-color)",
                            padding: "1rem",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.8rem",
                            maxWidth: "400px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.25rem",
                            marginTop: "0.5rem"
                          }}>
                            <strong>📍 Avenue Book Centre Retail counter</strong>
                            <p style={{ margin: "0 0 0.25rem 0", color: "var(--text-muted)" }}>Premium Novels, Curriculum Textbooks & Curated Stationery Supplies</p>
                            <a 
                              href="https://share.google/yFmSXGCZUwICm9x3o" 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ color: "var(--brand-primary)", fontWeight: 700, textDecoration: "underline" }}
                            >
                              Open Collection Map Location
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Step 4: Delivered / Collected */}
                {(() => {
                  const isDone = result.status === "DELIVERED";
                  const isPickup = result.shippingMethod === "PICKUP";
                  return (
                    <div style={{ display: "flex", gap: "1.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ 
                          width: "32px", 
                          height: "32px", 
                          borderRadius: "50%", 
                          background: isDone ? "var(--success)" : "var(--border-color)", 
                          color: isDone ? "#ffffff" : "var(--text-muted)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                          fontSize: "0.85rem",
                          fontWeight: 700
                        }}>
                          {isDone ? "✓" : "4"}
                        </div>
                      </div>
                      <div>
                        <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "0.95rem", fontWeight: 700, color: isDone ? "var(--text-primary)" : "var(--text-muted)" }}>
                          {isPickup ? "Collected by Customer" : "Delivered / Handed Over"}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          {isPickup 
                            ? "Package collected successfully from our storefront."
                            : "Delivered to shipping destination address."}
                        </p>
                      </div>
                    </div>
                  );
                })()}

              </div>
            </div>

            {/* Indian Postal Service Simulated Checkpoints Panel */}
            {result.shippingMethod === "IPS" && result.trackingNumber && ["SHIPPED", "DELIVERED"].includes(result.status) && (
              <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                  <Truck size={18} color="var(--brand-primary)" />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Indian Postal Service - EMS Speed Post Logs</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {getSimulatedIpsLogs(result).map((log: any, idx: number) => (
                    <div key={idx} style={{
                      display: "flex",
                      gap: "1.25rem",
                      fontSize: "0.85rem",
                      borderLeft: "2px solid var(--border-color)",
                      paddingLeft: "1.25rem",
                      position: "relative"
                    }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: idx === 0 ? "var(--brand-primary)" : "var(--text-muted)",
                        position: "absolute",
                        left: "-5px",
                        top: "5px"
                      }}></div>
                      <div style={{ width: "120px", flexShrink: 0, color: "var(--text-muted)" }}>
                        {log.time}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <strong style={{ color: "var(--text-primary)", display: "block" }}>{log.status}</strong>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.8rem", marginTop: "0.1rem" }}>{log.location}</span>
                        <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", marginTop: "0.25rem" }}>{log.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Logistics Aggregator Simulated Checkpoints Panel */}
            {result.shippingMethod === "AGGREGATOR" && result.trackingNumber && ["SHIPPED", "DELIVERED"].includes(result.status) && (
              <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-color)", marginTop: "2rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
                  <Truck size={18} color="var(--brand-primary)" />
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>Logistics Aggregator - Express Courier Logs</h3>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {getSimulatedAggregatorLogs(result).map((log: any, idx: number) => (
                    <div key={idx} style={{
                      display: "flex",
                      gap: "1.25rem",
                      fontSize: "0.85rem",
                      borderLeft: "2px solid var(--border-color)",
                      paddingLeft: "1.25rem",
                      position: "relative"
                    }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: idx === 0 ? "var(--brand-primary)" : "var(--text-muted)",
                        position: "absolute",
                        left: "-5px",
                        top: "5px"
                      }}></div>
                      <div style={{ width: "120px", flexShrink: 0, color: "var(--text-muted)" }}>
                        {log.time}
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <strong style={{ color: "var(--text-primary)", display: "block" }}>{log.status}</strong>
                        <span style={{ color: "var(--text-secondary)", display: "block", fontSize: "0.8rem", marginTop: "0.1rem" }}>{log.location}</span>
                        <span style={{ color: "var(--text-muted)", display: "block", fontSize: "0.75rem", marginTop: "0.25rem" }}>{log.details}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shopping Summary */}
            <div className="card" style={{ padding: "2rem", border: "1px solid var(--border-color)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 1.25rem 0", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Package size={18} color="var(--brand-primary)" />
                Package Summary
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {result.items && result.items.map((item: any, idx: number) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.9rem" }}>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      {item.product?.imageUrl ? (
                        <img src={item.product.imageUrl} alt={item.product.name} style={{ width: "36px", height: "45px", objectFit: "cover", borderRadius: "4px" }} />
                      ) : (
                        <div style={{ width: "36px", height: "45px", background: "var(--bg-tertiary)", borderRadius: "4px" }} />
                      )}
                      <div>
                        <strong style={{ color: "var(--text-primary)" }}>{item.product?.name || "Deleted Product"}</strong>
                        <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>SKU: {item.product?.sku || "N/A"}</span>
                      </div>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-secondary)" }}>Qty: {item.quantity}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "1rem" }}>
              <Link href="/" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem" }}>
                Return to Storefront
              </Link>
            </div>
            
          </div>
        )}

      </div>
    </div>
  );
}
