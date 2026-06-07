"use client";

import React, { useState } from "react";
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Scale, 
  Tag, 
  AlertTriangle,
  Award,
  BookOpen,
  Users,
  Percent,
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";

interface ProductMetric {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantitySold: number;
  revenue: number;
  stock: number;
  status: string;
}

interface SalesReportItem {
  date: string;
  ordersCount: number;
  itemsCount: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
}

interface Props {
  report: {
    kpis: {
      totalOrders: number;
      totalRevenue: number;
      averageOrderValue: number;
      totalWeightShipped: number;
      totalDiscountsGiven: number;
    };
    couponUsage: { code: string; count: number }[];
    salesHistory: { date: string; revenue: number; ordersCount: number }[];
    topProducts: { name: string; sku: string; quantity: number; revenue: number }[];
    categoryPerformance: { name: string; revenue: number; quantity: number }[];
    topCustomers: { email: string; name: string; ordersCount: number; totalSpent: number }[];
    lowStockAlerts: any[];
    productMetrics: ProductMetric[];
    salesReport: SalesReportItem[];
  };
  currency: {
    symbol: string;
    code: string;
  };
}

export default function AdminReportsTabs({ report, currency }: Props) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "sales-report" | "product-report" | "products" | "customers" | "marketing"
  >("overview");

  const formatCurrency = (val: number) => {
    return `${currency.symbol}${val.toFixed(2)}`;
  };

  const tabs = [
    { id: "overview", label: "Overview & Trends", icon: TrendingUp },
    { id: "sales-report", label: "Sales Report", icon: DollarSign },
    { id: "product-report", label: "Product-wise Report", icon: FileText },
    { id: "products", label: "Product & Category Share", icon: BookOpen },
    { id: "customers", label: "VIP Spenders", icon: Users },
    { id: "marketing", label: "Coupons & Campaigns", icon: Percent },
  ];

  // Sales Report Grouping and Filter State
  const [salesPeriod, setSalesPeriod] = useState<"day" | "week" | "month">("day");
  const [salesStartDate, setSalesStartDate] = useState("");
  const [salesEndDate, setSalesEndDate] = useState("");

  // Product Report Filter State
  const [prodSearch, setProdSearch] = useState("");
  const [prodCategory, setProdCategory] = useState("ALL");
  const [prodStockStatus, setProdStockStatus] = useState("ALL");
  const [prodCurrentPage, setProdCurrentPage] = useState(1);
  const prodItemsPerPage = 10;

  // 1. Grouped Sales Report logic
  const getGroupedSalesReport = () => {
    let filtered = report.salesReport || [];
    if (salesStartDate) {
      filtered = filtered.filter(item => item.date >= salesStartDate);
    }
    if (salesEndDate) {
      filtered = filtered.filter(item => item.date <= salesEndDate);
    }

    if (salesPeriod === "day") {
      return filtered;
    }

    const grouped = new Map<string, SalesReportItem>();

    filtered.forEach(item => {
      let key = "";
      const d = new Date(item.date);
      if (salesPeriod === "month") {
        // Group by YYYY-MM
        key = item.date.substring(0, 7);
      } else {
        // Group by Week: find the Sunday of this week
        const day = d.getDay();
        const diff = d.getDate() - day; // adjust to Sunday
        const sunday = new Date(d.setDate(diff));
        key = `Week of ${sunday.toISOString().split('T')[0]}`;
      }

      const current = grouped.get(key) || {
        date: key,
        ordersCount: 0,
        itemsCount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0
      };
      current.ordersCount += item.ordersCount;
      current.itemsCount += item.itemsCount;
      current.taxAmount += item.taxAmount;
      current.discountAmount += item.discountAmount;
      current.totalAmount += item.totalAmount;
      grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((a, b) => b.date.localeCompare(a.date));
  };

  const groupedSales = getGroupedSalesReport();
  
  // Calculate grouped totals
  const totalSalesOrders = groupedSales.reduce((sum, item) => sum + item.ordersCount, 0);
  const totalSalesItems = groupedSales.reduce((sum, item) => sum + item.itemsCount, 0);
  const totalSalesTax = groupedSales.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalSalesDiscounts = groupedSales.reduce((sum, item) => sum + item.discountAmount, 0);
  const totalSalesRevenue = groupedSales.reduce((sum, item) => sum + item.totalAmount, 0);

  // 2. Product-wise sales logic
  const filteredProducts = (report.productMetrics || []).filter(prod => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
      prod.sku.toLowerCase().includes(prodSearch.toLowerCase());
    const matchesCategory = prodCategory === "ALL" || prod.category === prodCategory;
    
    let matchesStock = true;
    if (prodStockStatus === "OUT") matchesStock = prod.stock === 0;
    else if (prodStockStatus === "LOW") matchesStock = prod.stock > 0 && prod.stock < 10;
    else if (prodStockStatus === "GOOD") matchesStock = prod.stock >= 10;

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Unique categories list for dropdown filter
  const uniqueCategories = Array.from(new Set((report.productMetrics || []).map(p => p.category)));

  // Pagination bounds
  const totalProductPages = Math.ceil(filteredProducts.length / prodItemsPerPage) || 1;
  const indexOfLastProd = prodCurrentPage * prodItemsPerPage;
  const indexOfFirstProd = indexOfLastProd - prodItemsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProd, indexOfLastProd);

  // Reset page when filters change
  const handleProductFilterChange = (setter: any, val: any) => {
    setter(val);
    setProdCurrentPage(1);
  };

  return (
    <div>
      {/* Dynamic Tabs Selection Row */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #e2e8f0",
        marginBottom: "2rem",
        gap: "0.5rem",
        flexWrap: "wrap"
      }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.25rem",
                border: "none",
                background: "transparent",
                borderBottom: isActive ? "3px solid var(--brand-primary)" : "3px solid transparent",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "var(--brand-primary)" : "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.9rem",
                transition: "all 0.15s",
                outline: "none"
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Render Tab Contents */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Custom SVG Line Chart */}
          <div style={{
            background: "#1e293b",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            color: "#ffffff",
            boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <h3 style={{ fontSize: "1.1rem", margin: "0 0 1.5rem 0", fontWeight: 700, color: "#94a3b8", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TrendingUp size={18} color="#0ea5e9" />
              14-Day Sales Revenue Trend
            </h3>
            <SalesLineChart data={report.salesHistory} formatCurrency={formatCurrency} />
          </div>

          {/* Critical Warnings */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "2rem" }}>
            {/* Low Stock Warnings */}
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                <AlertTriangle size={18} color="var(--danger)" />
                Restocking Alerts (&lt;10 Units)
              </h3>
              {report.lowStockAlerts.length === 0 ? (
                <div style={{
                  padding: "1.5rem",
                  background: "rgba(16, 185, 129, 0.05)",
                  border: "1px dashed var(--success)",
                  color: "var(--success)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.85rem",
                  textAlign: "center",
                  fontWeight: 600
                }}>
                  ✨ All inventory items are well-stocked.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {report.lowStockAlerts.slice(0, 3).map((item) => (
                    <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.5rem" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{item.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{item.sku}</div>
                      </div>
                      <span style={{
                        background: item.stock === 0 ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
                        color: item.stock === 0 ? "var(--danger)" : "#d97706",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 700
                      }}>
                        {item.stock === 0 ? "OUT" : `${item.stock} left`}
                      </span>
                    </div>
                  ))}
                  {report.lowStockAlerts.length > 3 && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.25rem" }}>
                      And {report.lowStockAlerts.length - 3} other items need restocking attention.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Performance Insights Summary */}
            <div style={{
              background: "#ffffff",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.01)",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              justifyContent: "space-between"
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)" }}>
                <Award size={18} color="var(--brand-primary)" />
                Insights & Recommendations
              </h3>
              
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div>
                  🚀 <strong>Top Selling Category</strong>:{" "}
                  {report.categoryPerformance.length > 0 ? (
                    <span style={{ fontWeight: 600, color: "var(--brand-primary)" }}>
                      {report.categoryPerformance[0].name} ({formatCurrency(report.categoryPerformance[0].revenue)})
                    </span>
                  ) : (
                    "No Sales data recorded yet."
                  )}
                </div>
                <div>
                  📈 <strong>Average Basket Size</strong>:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {report.kpis.totalOrders > 0 
                      ? `${(report.kpis.totalWeightShipped / report.kpis.totalOrders).toFixed(1)} kg average package weight`
                      : "No metrics."
                    }
                  </span>
                </div>
                <div>
                  💳 <strong>Marketing Conversions</strong>:{" "}
                  <span style={{ fontWeight: 600 }}>
                    {report.couponUsage.length > 0
                      ? `${report.couponUsage.reduce((sum, c) => sum + c.count, 0)} coupon claims logged`
                      : "No active coupon claims."
                    }
                  </span>
                </div>
              </div>
              
              <div style={{ fontSize: "0.75rem", background: "var(--bg-secondary)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", color: "var(--text-muted)" }}>
                💡 <em>Tip: Optimize marketing budgets by creating discount coupons for low-performing product categories.</em>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Report Tab Content */}
      {activeTab === "sales-report" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          {/* Filters & Options */}
          <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Group By Period</label>
              <select 
                value={salesPeriod}
                onChange={(e) => setSalesPeriod(e.target.value as any)}
                className="input-base"
                style={{ padding: "0.5rem 2rem 0.5rem 1rem", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
              >
                <option value="day">Group By Day</option>
                <option value="week">Group By Week</option>
                <option value="month">Group By Month</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Start Date</label>
              <input 
                type="date" 
                value={salesStartDate}
                onChange={(e) => setSalesStartDate(e.target.value)}
                className="input-base"
                style={{ padding: "0.45rem 1rem", fontSize: "0.875rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>End Date</label>
              <input 
                type="date" 
                value={salesEndDate}
                onChange={(e) => setSalesEndDate(e.target.value)}
                className="input-base"
                style={{ padding: "0.45rem 1rem", fontSize: "0.875rem" }}
              />
            </div>

            <button 
              onClick={() => {
                setSalesStartDate("");
                setSalesEndDate("");
                setSalesPeriod("day");
              }}
              className="btn btn-outline"
              style={{ padding: "0.5rem 1rem", fontSize: "0.875rem" }}
            >
              Reset Filters
            </button>
          </div>

          {/* Sales Totals summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>Selected Orders</span>
              <h4 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>{totalSalesOrders}</h4>
            </div>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>Quantity Sold</span>
              <h4 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>{totalSalesItems} units</h4>
            </div>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>Tax Collected</span>
              <h4 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0 0", color: "#64748b" }}>{formatCurrency(totalSalesTax)}</h4>
            </div>
            <div style={{ background: "#f8fafc", padding: "1.25rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>Coupon Savings</span>
              <h4 style={{ fontSize: "1.4rem", fontWeight: 800, margin: "0.25rem 0 0 0", color: "var(--danger)" }}>-{formatCurrency(totalSalesDiscounts)}</h4>
            </div>
            <div style={{ background: "rgba(14, 165, 233, 0.08)", padding: "1.25rem", borderRadius: "8px", border: "1px solid rgba(14, 165, 233, 0.2)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--brand-primary)", display: "block", fontWeight: 700, textTransform: "uppercase" }}>Net Revenue</span>
              <h4 style={{ fontSize: "1.4rem", fontWeight: 900, margin: "0.25rem 0 0 0", color: "var(--brand-primary)" }}>{formatCurrency(totalSalesRevenue)}</h4>
            </div>
          </div>

          {/* Grouped Sales Table */}
          <div className="card" style={{ background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {groupedSales.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                No sales records found for the selected date range.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textTransform: "none", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Period / Date</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Orders Count</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Products Sold</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>Taxes</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>Discounts Allowed</th>
                      <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>Gross Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedSales.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }} className="table-row-hover">
                        <td style={{ padding: "1rem 1.5rem", fontWeight: 600 }}>{item.date}</td>
                        <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontWeight: 700, color: "var(--text-primary)" }}>{item.ordersCount}</td>
                        <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>{item.itemsCount} units</td>
                        <td style={{ padding: "1rem 1.5rem", textAlign: "right", color: "#64748b" }}>{formatCurrency(item.taxAmount)}</td>
                        <td style={{ padding: "1rem 1.5rem", textAlign: "right", color: "var(--danger)" }}>
                          {item.discountAmount > 0 ? `-${formatCurrency(item.discountAmount)}` : formatCurrency(0)}
                        </td>
                        <td style={{ padding: "1rem 1.5rem", textAlign: "right", fontWeight: 800, color: "var(--brand-primary)" }}>
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                    {/* Table Summary Footer */}
                    <tr style={{ background: "#f8fafc", fontWeight: 800, borderTop: "2px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem 1.5rem" }}>Total Summary</td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>{totalSalesOrders}</td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>{totalSalesItems}</td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right", color: "#64748b" }}>{formatCurrency(totalSalesTax)}</td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right", color: "var(--danger)" }}>-{formatCurrency(totalSalesDiscounts)}</td>
                      <td style={{ padding: "1rem 1.5rem", textAlign: "right", color: "var(--brand-primary)", fontSize: "1rem" }}>{formatCurrency(totalSalesRevenue)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product-wise Report Tab Content */}
      {activeTab === "product-report" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {/* Filters Bar */}
          <div className="card" style={{ padding: "1.5rem", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "flex-end" }}>
            
            <div style={{ display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", flex: 1, minWidth: "260px", height: "42px" }}>
              <Search size={16} color="var(--text-muted)" style={{ marginRight: "0.5rem" }} />
              <input 
                type="text" 
                placeholder="Filter by Product Name or SKU SKU..." 
                value={prodSearch}
                onChange={(e) => handleProductFilterChange(setProdSearch, e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Filter by Category</label>
              <select 
                value={prodCategory}
                onChange={(e) => handleProductFilterChange(setProdCategory, e.target.value)}
                className="input-base"
                style={{ padding: "0.5rem 2rem 0.5rem 1rem", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
              >
                <option value="ALL">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Stock Availability</label>
              <select 
                value={prodStockStatus}
                onChange={(e) => handleProductFilterChange(setProdStockStatus, e.target.value)}
                className="input-base"
                style={{ padding: "0.5rem 2rem 0.5rem 1rem", background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}
              >
                <option value="ALL">All Stock Levels</option>
                <option value="GOOD">{"In Stock (>= 10)"}</option>
                <option value="LOW">{"Low Stock (< 10)"}</option>
                <option value="OUT">{"Out of Stock (= 0)"}</option>
              </select>
            </div>

            <button 
              onClick={() => {
                setProdSearch("");
                setProdCategory("ALL");
                setProdStockStatus("ALL");
                setProdCurrentPage(1);
              }}
              className="btn btn-outline"
              style={{ padding: "0.5rem 1.25rem", height: "42px", display: "flex", alignItems: "center", gap: "0.25rem" }}
            >
              Clear
            </button>
          </div>

          {/* Product metrics overview cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" }}>
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>Matched Products</span>
              <h4 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>{filteredProducts.length} items</h4>
            </div>
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>Total Quantity Sold</span>
              <h4 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0.25rem 0 0 0" }}>
                {filteredProducts.reduce((sum, p) => sum + p.quantitySold, 0)} units
              </h4>
            </div>
            <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", fontWeight: 700 }}>Accumulated Revenue</span>
              <h4 style={{ fontSize: "1.6rem", fontWeight: 800, margin: "0.25rem 0 0 0", color: "var(--brand-primary)" }}>
                {formatCurrency(filteredProducts.reduce((sum, p) => sum + p.revenue, 0))}
              </h4>
            </div>
          </div>

          {/* Products List Table */}
          <div className="card" style={{ background: "#ffffff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
            {currentProducts.length === 0 ? (
              <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
                No product entries match active filters.
              </div>
            ) : (
              <div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                        <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Product Details</th>
                        <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)" }}>Category</th>
                        <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Available Stock</th>
                        <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Quantity Sold</th>
                        <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "right" }}>Total Revenue</th>
                        <th style={{ padding: "1rem 1.5rem", fontWeight: 700, color: "var(--text-secondary)", textAlign: "center" }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentProducts.map((prod) => (
                        <tr key={prod.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="table-row-hover">
                          <td style={{ padding: "1rem 1.5rem" }}>
                            <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{prod.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>SKU: {prod.sku}</div>
                          </td>
                          <td style={{ padding: "1rem 1.5rem" }}>{prod.category}</td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              fontSize: "0.75rem",
                              background: prod.stock === 0 ? "#fee2e2" : prod.stock < 10 ? "#fef3c7" : "#d1fae5",
                              color: prod.stock === 0 ? "#ef4444" : prod.stock < 10 ? "#d97706" : "#10b981"
                            }}>
                              {prod.stock === 0 ? "Out of Stock" : `${prod.stock} units`}
                            </span>
                          </td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center", fontWeight: 600 }}>{prod.quantitySold} units</td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "right", fontWeight: 850, color: "var(--brand-primary)" }}>
                            {formatCurrency(prod.revenue)}
                          </td>
                          <td style={{ padding: "1rem 1.5rem", textAlign: "center" }}>
                            <span style={{
                              display: "inline-block",
                              padding: "0.2rem 0.4rem",
                              borderRadius: "4px",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              background: prod.status === "ACTIVE" ? "#e0f2fe" : "#f1f5f9",
                              color: prod.status === "ACTIVE" ? "#0369a1" : "#64748b"
                            }}>
                              {prod.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalProductPages > 1 && (
                  <div style={{ padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", background: "#f8fafc" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Showing {indexOfFirstProd + 1} to {Math.min(indexOfLastProd, filteredProducts.length)} of {filteredProducts.length} products
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button 
                        onClick={() => setProdCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={prodCurrentPage === 1}
                        className="btn btn-outline"
                        style={{ padding: "0.35rem 0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", opacity: prodCurrentPage === 1 ? 0.5 : 1 }}
                      >
                        <ChevronLeft size={14} /> Previous
                      </button>
                      <button 
                        onClick={() => setProdCurrentPage(prev => Math.min(totalProductPages, prev + 1))}
                        disabled={prodCurrentPage === totalProductPages}
                        className="btn btn-outline"
                        style={{ padding: "0.35rem 0.75rem", display: "flex", alignItems: "center", gap: "0.25rem", opacity: prodCurrentPage === totalProductPages ? 0.5 : 1 }}
                      >
                        Next <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "products" && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "2rem"
        }}>
          {/* Top Selling Products */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
              Top 5 Best-Selling Products
            </h3>
            {report.topProducts.length === 0 ? (
              <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                No product sales logged yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border-color)" }}>
                      <th style={{ textAlign: "left", padding: "0.5rem", color: "var(--text-muted)" }}>Item Description</th>
                      <th style={{ textAlign: "center", padding: "0.5rem", color: "var(--text-muted)" }}>Qty</th>
                      <th style={{ textAlign: "right", padding: "0.5rem", color: "var(--text-muted)" }}>Gross Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topProducts.map((p, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.75rem 0.5rem" }}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>{p.sku}</div>
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "center", fontWeight: 600 }}>
                          {p.quantity} units
                        </td>
                        <td style={{ padding: "0.75rem 0.5rem", textAlign: "right", fontWeight: 700, color: "var(--brand-primary)" }}>
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Category Revenue Share */}
          <div style={{
            background: "#ffffff",
            border: "1px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "2rem",
            boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--text-primary)" }}>
              Category Sales Performance
            </h3>
            {report.categoryPerformance.length === 0 ? (
              <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
                No category sales records logged yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {report.categoryPerformance.map((cat, idx) => {
                  const maxRevenue = Math.max(...report.categoryPerformance.map(c => c.revenue));
                  const percentage = maxRevenue > 0 ? (cat.revenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600 }}>
                        <span>{cat.name} <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>({cat.quantity} units)</span></span>
                        <strong style={{ color: "var(--text-primary)" }}>{formatCurrency(cat.revenue)}</strong>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: `${percentage}%`, height: "100%", background: "#0ea5e9", borderRadius: "4px" }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "customers" && (
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            VIP Spenders Leaderboard
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            The top 5 customer accounts sorted by gross billing volumes.
          </p>
          
          {report.topCustomers.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
              No client sales transactions logged in database.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "var(--text-muted)" }}>Client Name</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "left", color: "var(--text-muted)" }}>Email Address</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>Total Orders</th>
                    <th style={{ padding: "0.75rem 1rem", textAlign: "right", color: "var(--text-muted)" }}>Gross Invested</th>
                  </tr>
                </thead>
                <tbody>
                  {report.topCustomers.map((cust, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "1rem", fontWeight: 700 }}>{cust.name}</td>
                      <td style={{ padding: "1rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>{cust.email}</td>
                      <td style={{ padding: "1rem", textAlign: "center", fontWeight: 600 }}>{cust.ordersCount} checkouts</td>
                      <td style={{ padding: "1rem", textAlign: "right", fontWeight: 800, color: "var(--brand-primary)" }}>{formatCurrency(cust.totalSpent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "marketing" && (
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary)" }}>
            Promo Coupon Conversions
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            Usage metrics representing coupon conversions during checkout.
          </p>

          {report.couponUsage.length === 0 ? (
            <div style={{ padding: "3rem 1rem", textAlign: "center", color: "var(--text-muted)" }}>
              No coupons have been claimed in orders yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {report.couponUsage.map((coupon) => {
                const maxCount = Math.max(...report.couponUsage.map(c => c.count));
                const percentage = maxCount > 0 ? (coupon.count / maxCount) * 100 : 0;
                return (
                  <div key={coupon.code} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", fontWeight: 600 }}>
                      <span style={{
                        fontFamily: "monospace",
                        background: "var(--bg-secondary)",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                        color: "var(--text-primary)"
                      }}>{coupon.code}</span>
                      <span>{coupon.count} redemptions</span>
                    </div>
                    <div style={{ width: "100%", height: "12px", background: "var(--bg-tertiary)", borderRadius: "6px", overflow: "hidden" }}>
                      <div style={{ width: `${percentage}%`, height: "100%", background: "linear-gradient(90deg, var(--brand-primary) 0%, #ca8a04 100%)", borderRadius: "6px" }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Global CSS for Row Hovers */}
      <style>{`
        .table-row-hover:hover {
          background-color: #f8fafc !important;
          transition: background-color 0.15s ease;
        }
      `}</style>
    </div>
  );
}

/**
 * Clean SVG-only graph renderer mapping the 14-day sales trend beautifully
 */
function SalesLineChart({ data, formatCurrency }: { data: { date: string; revenue: number }[], formatCurrency: any }) {
  if (!data || data.length === 0) return null;

  const revenues = data.map(d => d.revenue);
  const maxRevenue = Math.max(...revenues, 100);

  const width = 600;
  const height = 200;
  const padding = 35;

  const points = data.map((d, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - (d.revenue / maxRevenue) * (height - padding * 2);
    return { x, y, date: d.date, revenue: d.revenue };
  });

  const pathD = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, "");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="220" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25"/>
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0"/>
          </linearGradient>
        </defs>

        {/* Grid Horizontal Guide lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (height - padding * 2);
          const val = maxRevenue * (1 - ratio);
          return (
            <g key={ratio}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={padding - 8} y={y + 4} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="end">
                {formatCurrency(val).split(".")[0]}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        <path d={areaD} fill="url(#areaGradient)" />

        {/* Solid Line */}
        <path d={pathD} fill="none" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="#0ea5e9" stroke="#1e293b" strokeWidth="1.5" />
            <title>{`${p.date}: ${formatCurrency(p.revenue)}`}</title>
          </g>
        ))}
        
        {/* Date labels */}
        {points.filter((_, i) => i % 3 === 0 || i === points.length - 1).map((p, i) => (
          <text key={i} x={p.x} y={height - 12} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
            {p.date.substring(5)}
          </text>
        ))}
      </svg>
    </div>
  );
}
