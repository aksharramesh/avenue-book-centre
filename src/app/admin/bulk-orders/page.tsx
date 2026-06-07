"use client";

import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  Eye, 
  Phone, 
  Mail, 
  Calendar, 
  Search, 
  ChevronDown,
  X,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  FileText
} from "lucide-react";
import { getBulkOrders, updateBulkOrderStatus } from "@/app/actions";

interface BulkOrder {
  id: string;
  organizationName: string;
  orgType: string;
  productCategory: string;
  quantityRange: string;
  contactName: string;
  email: string;
  phone: string;
  comments: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function AdminBulkOrdersPage() {
  const [orders, setOrders] = useState<BulkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<BulkOrder | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await getBulkOrders();
      if (res.success && res.orders) {
        // Parse dates correctly
        const parsed = res.orders.map((o: any) => ({
          ...o,
          createdAt: new Date(o.createdAt),
          updatedAt: new Date(o.updatedAt)
        }));
        setOrders(parsed);
      } else {
        setError(res.error || "Failed to load bulk inquiries.");
      }
    } catch (e: any) {
      setError(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await updateBulkOrderStatus(id, newStatus);
      if (res.success && res.order) {
        // Update local state
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus, updatedAt: new Date() } : o));
        if (selectedOrder && selectedOrder.id === id) {
          setSelectedOrder(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
        }
      } else {
        alert(res.error || "Failed to update status.");
      }
    } catch (e: any) {
      alert(e.message || "Error updating status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Filter logic
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalInquiries = orders.length;
  const pendingCount = orders.filter(o => o.status === "PENDING").length;
  const inProgressCount = orders.filter(o => o.status === "IN_PROGRESS").length;
  const fulfilledCount = orders.filter(o => o.status === "FULFILLED").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Title Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0" }}>
            Wholesale &amp; Bulk Inquiries
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            Manage and respond to institutional procurement requests and volume wholesale inquiries.
          </p>
        </div>
        <button 
          onClick={fetchOrders}
          disabled={loading}
          className="btn btn-outline" 
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "0.5rem" }}
        >
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid var(--brand-primary)" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Total Inquiries</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0 }}>{totalInquiries}</h3>
        </div>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #f59e0b" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Pending Review</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#d97706" }}>{pendingCount}</h3>
        </div>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #3b82f6" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>In Progress</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#2563eb" }}>{inProgressCount}</h3>
        </div>
        <div className="card" style={{ padding: "1.5rem", borderLeft: "4px solid #10b981" }}>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--text-muted)", display: "block", marginBottom: "0.25rem" }}>Fulfilled / Quote Sent</span>
          <h3 style={{ fontSize: "1.75rem", fontWeight: 800, margin: 0, color: "#059669" }}>{fulfilledCount}</h3>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: "1.25rem 1.5rem", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", background: "#ffffff", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", flex: 1, minWidth: "260px" }}>
          <Search size={18} color="var(--text-muted)" style={{ marginRight: "0.5rem" }} />
          <input 
            type="text" 
            placeholder="Search by Institution, contact person, email or reference ID..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
          />
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base"
            style={{ padding: "0.5rem 2rem 0.5rem 1rem", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
          >
            <option value="ALL">All Inquiries</option>
            <option value="PENDING">Pending Review</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FULFILLED">Fulfilled / Closed</option>
          </select>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", border: "1px solid var(--danger)", color: "var(--danger)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      )}

      {/* Main Inquiries Grid Table */}
      <div className="card" style={{ overflow: "hidden", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", background: "#ffffff" }}>
        {loading ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
            <span style={{ fontSize: "1rem" }}>Loading inquiries directory...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Inbox size={48} style={{ opacity: 0.3 }} />
            <span>No bulk inquiries found matching criteria.</span>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Date</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Reference ID</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Institution / Contact</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Interest Details</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Volume</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Status</th>
                  <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    style={{ borderBottom: "1px solid #f1f5f9", verticalAlign: "middle" }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <Calendar size={14} color="var(--text-muted)" />
                        <span>{order.createdAt.toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", fontFamily: "monospace", fontWeight: 600 }}>
                      {order.id}
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>{order.organizationName}</span>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{order.orgType} • {order.contactName}</span>
                      </div>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 500 }}>{order.productCategory}</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", whiteSpace: "nowrap" }}>
                      <span style={{ fontWeight: 700, color: "var(--brand-primary)" }}>{order.quantityRange} units</span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem" }}>
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.25rem 0.65rem",
                        borderRadius: "100px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        background: order.status === "PENDING" ? "#fef3c7" : order.status === "IN_PROGRESS" ? "#dbeafe" : "#d1fae5",
                        color: order.status === "PENDING" ? "#b45309" : order.status === "IN_PROGRESS" ? "#1d4ed8" : "#047857"
                      }}>
                        {order.status === "PENDING" && <Clock size={12} />}
                        {order.status === "IN_PROGRESS" && <Clock size={12} />}
                        {order.status === "FULFILLED" && <CheckCircle2 size={12} />}
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: "1rem 1.5rem", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button 
                          onClick={() => setSelectedOrder(order)}
                          className="btn btn-outline" 
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.25rem" }}
                        >
                          <Eye size={12} /> View
                        </button>
                        
                        <div style={{ position: "relative" }}>
                          <select 
                            value={order.status} 
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            style={{ 
                              padding: "0.35rem 1.5rem 0.35rem 0.5rem", 
                              fontSize: "0.75rem", 
                              borderRadius: "4px", 
                              border: "1px solid var(--border-color)", 
                              background: "#ffffff",
                              cursor: "pointer" 
                            }}
                          >
                            <option value="PENDING">Pending</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="FULFILLED">Fulfilled</option>
                          </select>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inquiry Detail Overlay Modal Drawer */}
      {selectedOrder && (
        <div style={{ 
          position: "fixed", 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          backgroundColor: "rgba(15, 23, 42, 0.4)", 
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          justifyContent: "flex-end"
        }}>
          <div style={{ 
            width: "100%", 
            maxWidth: "600px", 
            background: "#ffffff", 
            height: "100vh", 
            boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
            padding: "2.5rem 2rem",
            display: "flex",
            flexDirection: "column",
            gap: "2rem",
            overflowY: "auto"
          }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--brand-primary)", display: "block", marginBottom: "0.25rem" }}>
                  Procurement Request Reference
                </span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--text-primary)", margin: 0, fontFamily: "monospace" }}>
                  {selectedOrder.id}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Status Panel inside drawer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-primary)", padding: "1rem 1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Inquiry Status:</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <select 
                  value={selectedOrder.status}
                  disabled={updatingId === selectedOrder.id}
                  onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                  className="input-base"
                  style={{ padding: "0.4rem 1.5rem 0.4rem 0.75rem", background: "#ffffff", fontSize: "0.85rem", borderRadius: "4px" }}
                >
                  <option value="PENDING">Pending Review</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="FULFILLED">Fulfilled / Closed</option>
                </select>
              </div>
            </div>

            {/* Institution / Org Details Card */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                <Building2 size={18} color="var(--brand-primary)" /> Institution Profile
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Organization</span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{selectedOrder.organizationName}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Org Type</span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{selectedOrder.orgType}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Contact Name</span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{selectedOrder.contactName}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Submitted At</span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{selectedOrder.createdAt.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                <Phone size={18} color="var(--brand-primary)" /> Contact Info
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Mail size={16} color="var(--text-muted)" />
                  <a href={`mailto:${selectedOrder.email}`} style={{ color: "var(--brand-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                    {selectedOrder.email}
                  </a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Phone size={16} color="var(--text-muted)" />
                  <a href={`tel:${selectedOrder.phone}`} style={{ color: "var(--text-primary)", textDecoration: "none", fontWeight: 600, fontSize: "0.9rem" }}>
                    {selectedOrder.phone}
                  </a>
                </div>
              </div>
            </div>

            {/* Categories and Quantity details */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                <FileSpreadsheet size={18} color="var(--brand-primary)" /> Requirement Specifications
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Categories of Interest</span>
                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-primary)" }}>{selectedOrder.productCategory}</span>
                </div>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Estimated Target Volume</span>
                  <span style={{ fontWeight: 800, fontSize: "1.1rem", color: "var(--brand-primary)" }}>{selectedOrder.quantityRange} units</span>
                </div>
              </div>
            </div>

            {/* Logistics and Comments */}
            {selectedOrder.comments && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                  <FileText size={18} color="var(--brand-primary)" /> Inquiry details &amp; Comments
                </h3>
                <div style={{ 
                  background: "#fdfdfd", 
                  border: "1px dashed var(--border-color)", 
                  padding: "1.25rem", 
                  borderRadius: "8px", 
                  whiteSpace: "pre-wrap", 
                  fontSize: "0.875rem", 
                  color: "var(--text-secondary)",
                  lineHeight: "1.5"
                }}>
                  {selectedOrder.comments}
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "1.5rem" }}>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="btn btn-outline" 
                style={{ flex: 1, padding: "0.75rem" }}
              >
                Close Drawer
              </button>
              <a 
                href={`mailto:${selectedOrder.email}?subject=Bulk Inquiry Response: Ref ${selectedOrder.id}&body=Hello ${selectedOrder.contactName},%0D%0A%0D%0AThank you for contacting Avenue Book Centre regarding your bulk procurement query for ${selectedOrder.organizationName}.`}
                className="btn btn-primary" 
                style={{ flex: 1, padding: "0.75rem", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", textDecoration: "none", fontWeight: 700 }}
              >
                <Mail size={16} /> Reply by Email
              </a>
            </div>

          </div>
        </div>
      )}

      {/* Global CSS Overrides for nice animations and hover */}
      <style>{`
        .table-row-hover:hover {
          background-color: #f8fafc !important;
          transition: background-color 0.15s ease;
        }
      `}</style>
    </div>
  );
}
