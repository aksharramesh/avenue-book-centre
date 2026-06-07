"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  bulkUpdateProductPrice,
  bulkUpdateProductStock,
  deleteProduct,
  duplicateProduct,
  bulkUpdateProductCategory,
  bulkUpdateProductFastDispatch,
  updateProductPriceDirect,
} from "@/app/actions";
import {
  Trash2, Copy, Edit, MoreVertical, Loader2, CheckSquare, Square, MinusSquare,
  Package, AlertTriangle, Archive, Boxes, Plus, Search, Filter,
  DollarSign, BarChart3, Tag, X, ChevronDown
} from "lucide-react";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  discountPrice?: number | null;
  discountEndDate?: string | null;
  stock: number;
  status: string;
  imageUrl: string | null;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
}

// HTML5 Canvas interactive product catalog scatter map
function ProductCatalogCanvas({
  products,
  selected,
  onToggle,
  onSelectRange,
  currencySymbol = "₹",
}: {
  products: Product[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectRange: (ids: string[], clearOthers?: boolean) => void;
  currencySymbol?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 260 });
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);


  // Auto-resize canvas
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        setDimensions({ width, height: 260 });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const prices = products.map(p => p.price);
  const stocks = products.map(p => p.stock);
  const maxPrice = prices.length > 0 ? Math.max(...prices, 10) : 100;
  const maxStock = stocks.length > 0 ? Math.max(...stocks, 10) : 100;

  const margin = { top: 30, right: 40, bottom: 40, left: 55 };

  const getCanvasCoords = (price: number, stock: number, w: number, h: number) => {
    const chartWidth = w - margin.left - margin.right;
    const chartHeight = h - margin.top - margin.bottom;
    const x = margin.left + (price / maxPrice) * chartWidth;
    const y = margin.top + chartHeight - (stock / maxStock) * chartHeight;
    return { x, y };
  };

  const getProductFromCoords = (x: number, y: number, w: number, h: number) => {
    for (const p of products) {
      const coords = getCanvasCoords(p.price, p.stock, w, h);
      const radius = 6 + Math.min(10, (p.stock / maxStock) * 10);
      const dist = Math.hypot(coords.x - x, coords.y - y);
      if (dist <= radius + 5) {
        return p;
      }
    }
    return null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;
    ctx.scale(dpr, dpr);

    const w = dimensions.width;
    const h = dimensions.height;

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    // Draw horizontal danger zone for low stock (Stock < 10)
    const dangerY = getCanvasCoords(0, 10, w, h).y;
    if (dangerY < margin.top + chartH) {
      const grad = ctx.createLinearGradient(0, dangerY, 0, margin.top + chartH);
      grad.addColorStop(0, "rgba(239, 68, 68, 0.0)");
      grad.addColorStop(1, "rgba(239, 68, 68, 0.04)");
      ctx.fillStyle = grad;
      ctx.fillRect(margin.left, dangerY, chartW, margin.top + chartH - dangerY);

      ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, dangerY);
      ctx.lineTo(margin.left + chartW, dangerY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "rgba(220, 38, 38, 0.75)";
      ctx.font = "bold 9px system-ui";
      ctx.fillText("LOW STOCK ALERT (< 10 UNITS)", margin.left + 8, dangerY - 6);
    }

    // Grid lines
    ctx.strokeStyle = "rgba(15, 23, 42, 0.06)";
    ctx.lineWidth = 1;
    const gridCols = 8;
    const gridRows = 5;

    for (let i = 0; i <= gridCols; i++) {
      const x = margin.left + (i / gridCols) * chartW;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartH);
      ctx.stroke();

      // Labels
      ctx.fillStyle = "var(--text-muted)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      const val = (i / gridCols) * maxPrice;
      ctx.fillText(`${currencySymbol}${val.toFixed(0)}`, x, margin.top + chartH + 18);
    }

    for (let i = 0; i <= gridRows; i++) {
      const y = margin.top + chartH - (i / gridRows) * chartH;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartW, y);
      ctx.stroke();

      // Labels
      ctx.fillStyle = "var(--text-muted)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "right";
      const val = (i / gridRows) * maxStock;
      ctx.fillText(val.toFixed(0), margin.left - 8, y + 3.5);
    }

    // Grid Axes titles
    ctx.fillStyle = "var(--text-secondary)";
    ctx.font = "bold 9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("UNIT STOCK LEVEL", margin.left - 38, margin.top - 8);
    ctx.fillText(`UNIT PRICE (${currencySymbol})`, margin.left + chartW / 2, margin.top + chartH + 34);

    // Draw products
    products.forEach(p => {
      const coords = getCanvasCoords(p.price, p.stock, w, h);
      const isSel = selected.has(p.id);
      const isHover = hoveredProduct?.id === p.id;
      
      const baseRadius = 6 + Math.min(10, (p.stock / maxStock) * 10);
      const radius = isHover ? baseRadius + 3 : baseRadius;

      // Glow halo
      let glowColor = "rgba(16, 185, 129, 0.25)";
      if (p.status === "DRAFT") glowColor = "rgba(167, 139, 250, 0.25)";
      else if (p.status === "OUT_OF_STOCK" || p.stock === 0) glowColor = "rgba(239, 68, 68, 0.25)";

      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();

      // Selected ring
      if (isSel) {
        ctx.strokeStyle = "var(--brand-primary)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, radius + 7, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inner dot
      let color = "var(--success)";
      if (p.status === "DRAFT") color = "#7c3aed";
      else if (p.status === "OUT_OF_STOCK" || p.stock === 0) color = "var(--danger)";

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(coords.x, coords.y, radius, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Draw Drag Bounding Box
    if (isDragging && dragStart && dragEnd) {
      const boxX = Math.min(dragStart.x, dragEnd.x);
      const boxY = Math.min(dragStart.y, dragEnd.y);
      const boxW = Math.abs(dragStart.x - dragEnd.x);
      const boxH = Math.abs(dragStart.y - dragEnd.y);

      ctx.fillStyle = "rgba(14, 165, 233, 0.08)";
      ctx.fillRect(boxX, boxY, boxW, boxH);

      ctx.strokeStyle = "rgba(14, 165, 233, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.setLineDash([]);
    }

    // Draw custom Tooltip
    if (hoveredProduct) {
      const coords = getCanvasCoords(hoveredProduct.price, hoveredProduct.stock, w, h);
      const tooltipW = 210;
      const tooltipH = 88;
      
      // Determine best tooltip placement
      let tipX = coords.x + 12;
      let tipY = coords.y - tooltipH / 2;
      if (tipX + tooltipW > w - 10) tipX = coords.x - tooltipW - 12;
      if (tipY + tooltipH > h - 10) tipY = h - tooltipH - 10;
      if (tipY < 10) tipY = 10;

      // Card Box shadow
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.lineWidth = 1;
      
      // Rounded rect
      ctx.beginPath();
      ctx.roundRect?.(tipX, tipY, tooltipW, tooltipH, 10);
      ctx.fill();
      ctx.stroke();

      // Texts
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px system-ui";
      ctx.textAlign = "left";
      ctx.fillText(
        hoveredProduct.name.length > 28 ? `${hoveredProduct.name.substring(0, 26)}...` : hoveredProduct.name,
        tipX + 12,
        tipY + 18
      );

      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px monospace";
      ctx.fillText(`SKU: ${hoveredProduct.sku}`, tipX + 12, tipY + 34);

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px system-ui";
      ctx.fillText(`Price: ${currencySymbol}${hoveredProduct.price.toFixed(2)}`, tipX + 12, tipY + 52);
      ctx.fillText(`Stock: ${hoveredProduct.stock} units`, tipX + 12, tipY + 68);

      // Status indicator
      ctx.textAlign = "right";
      ctx.font = "bold 9px system-ui";
      
      let statusColor = "#10b981";
      if (hoveredProduct.status === "DRAFT") statusColor = "#a78bfa";
      else if (hoveredProduct.status === "OUT_OF_STOCK" || hoveredProduct.stock === 0) statusColor = "#ef4444";

      ctx.fillStyle = statusColor;
      ctx.fillText(hoveredProduct.status, tipX + tooltipW - 12, tipY + 34);

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.font = "9px system-ui";
      ctx.fillText("Click to Select", tipX + tooltipW - 12, tipY + 68);
    }
  }, [dimensions, products, selected, hoveredProduct, isDragging, dragStart, dragEnd]);

  // Mouse Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });

    if (isDragging) {
      setDragEnd({ x, y });
      return;
    }

    const hit = getProductFromCoords(x, y, dimensions.width, dimensions.height);
    setHoveredProduct(hit);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = getProductFromCoords(x, y, dimensions.width, dimensions.height);
    if (hit) {
      onToggle(hit.id);
      return;
    }

    // Start box lasso selection
    setIsDragging(true);
    setDragStart({ x, y });
    setDragEnd({ x, y });
    setHoveredProduct(null);
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);

    if (dragStart && dragEnd) {
      const minX = Math.min(dragStart.x, dragEnd.x);
      const maxX = Math.max(dragStart.x, dragEnd.x);
      const minY = Math.min(dragStart.y, dragEnd.y);
      const maxY = Math.max(dragStart.y, dragEnd.y);

      const dragW = maxX - minX;
      const dragH = maxY - minY;

      if (dragW > 4 && dragH > 4) {
        const capturedIds: string[] = [];
        products.forEach(p => {
          const coords = getCanvasCoords(p.price, p.stock, dimensions.width, dimensions.height);
          if (coords.x >= minX && coords.x <= maxX && coords.y >= minY && coords.y <= maxY) {
            capturedIds.push(p.id);
          }
        });

        if (capturedIds.length > 0) {
          onSelectRange(capturedIds, true);
        }
      }
    }

    setDragStart(null);
    setDragEnd(null);
  };

  return (
    <div ref={containerRef} className="card" style={{ padding: "1.25rem", background: "#ffffff", border: "1px solid var(--border-color)", overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
        <div>
          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--brand-primary)" }} />
            Stock & Price Telemetry Map
          </h4>
          <p style={{ margin: "0.15rem 0 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Drag selection boxes (lasso select) over dots or click them to select items bulk-wise.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--success)" }} /> Active
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#7c3aed" }} /> Draft
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--danger)" }} /> Out of Stock
          </div>
        </div>
      </div>

      <div style={{ position: "relative", cursor: isDragging ? "crosshair" : "default" }}>
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          style={{ display: "block" }}
        />
      </div>
    </div>
  );
}

export default function ProductTable({ products, categories, currencySymbol = "$", enableInlineEditing = true }: { products: Product[]; categories: Category[]; currencySymbol?: string; enableInlineEditing?: boolean }) {
  const router = useRouter();
  const [localProducts, setLocalProducts] = useState<Product[]>(products);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [editDiscountPrice, setEditDiscountPrice] = useState<string>("");
  const [isSavingPrice, setIsSavingPrice] = useState(false);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [bulkAction, setBulkAction] = useState<string>("");
  const [bulkModal, setBulkModal] = useState<string | null>(null);
  const [modalValue, setModalValue] = useState("");
  const [modalMode, setModalMode] = useState("set");
  const [rowMenuOpen, setRowMenuOpen] = useState<string | null>(null);

  // New search query and category bulk selection states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  // Sync props to state
  useEffect(() => {
    setLocalProducts(products);
  }, [products]);

  // Auto-select first category if available when modal opens
  useEffect(() => {
    if (categories && categories.length > 0) {
      setSelectedCategoryId(categories[0].id);
    }
  }, [categories]);

  // Auto-dismiss feedback
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Close row menu on outside click
  useEffect(() => {
    function handler() { setRowMenuOpen(null); }
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Filter products by SKU, name, or category name
  const filteredProducts = localProducts.filter(p => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.category.name.toLowerCase().includes(query)
    );
  });

  const allSelected = filteredProducts.length > 0 && filteredProducts.every(p => selected.has(p.id));
  const someSelected = filteredProducts.some(p => selected.has(p.id)) && !allSelected;

  function toggleAll() {
    if (allSelected) {
      // Unselect all currently visible filtered products
      const next = new Set(selected);
      filteredProducts.forEach(p => next.delete(p.id));
      setSelected(next);
    } else {
      // Select all currently visible filtered products
      const next = new Set(selected);
      filteredProducts.forEach(p => next.add(p.id));
      setSelected(next);
    }
  }

  function toggleOne(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function executeBulkAction() {
    const ids = Array.from(selected);
    if (!ids.length) return;

    setLoading(true);
    let result: any;

    try {
      switch (bulkAction) {
        case "delete":
          if (!confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) {
            setLoading(false);
            return;
          }
          result = await bulkDeleteProducts(ids);
          break;
        case "status_active":
          result = await bulkUpdateProductStatus(ids, "ACTIVE");
          break;
        case "status_draft":
          result = await bulkUpdateProductStatus(ids, "DRAFT");
          break;
        case "status_oos":
          result = await bulkUpdateProductStatus(ids, "OUT_OF_STOCK");
          break;
        case "update_price":
          setBulkModal("price");
          setLoading(false);
          return;
        case "update_stock":
          setBulkModal("stock");
          setLoading(false);
          return;
        case "update_category":
          setBulkModal("category");
          setLoading(false);
          return;
        case "fast_dispatch_enable":
          result = await bulkUpdateProductFastDispatch(ids, true);
          break;
        case "fast_dispatch_disable":
          result = await bulkUpdateProductFastDispatch(ids, false);
          break;
        default:
          setLoading(false);
          return;
      }

      if (result?.success) {
        setFeedback({ type: "success", message: result.message });
        setSelected(new Set());
        setBulkAction("");
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result?.error || "Operation failed." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "An error occurred." });
    }
    setLoading(false);
  }

  async function submitModal() {
    const ids = Array.from(selected);
    const numVal = parseFloat(modalValue);
    if (isNaN(numVal)) {
      setFeedback({ type: "error", message: "Please enter a valid number." });
      return;
    }

    setLoading(true);
    let result: any;

    try {
      if (bulkModal === "price") {
        result = await bulkUpdateProductPrice(ids, modalMode as any, numVal);
      } else if (bulkModal === "stock") {
        result = await bulkUpdateProductStock(ids, modalMode as any, numVal);
      }

      if (result?.success) {
        setFeedback({ type: "success", message: result.message });
        setSelected(new Set());
        setBulkAction("");
        setBulkModal(null);
        setModalValue("");
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result?.error || "Operation failed." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "An error occurred." });
    }
    setLoading(false);
  }

  async function submitCategoryModal() {
    const ids = Array.from(selected);
    if (!selectedCategoryId) return;

    setLoading(true);
    try {
      const result = await bulkUpdateProductCategory(ids, selectedCategoryId);
      if (result?.success) {
        setFeedback({ type: "success", message: result.message });
        setSelected(new Set());
        setBulkAction("");
        setBulkModal(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result?.error || "Operation failed." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "An error occurred." });
    }
    setLoading(false);
  }

  async function handleRowDelete(productId: string, productName: string) {
    if (!confirm(`Delete "${productName}"? This cannot be undone.`)) return;
    setLoading(true);
    const result = await deleteProduct(productId);
    if (result.success) {
      setFeedback({ type: "success", message: "Product deleted." });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error || "Delete failed." });
    }
    setLoading(false);
  }

  async function handleRowDuplicate(productId: string) {
    setLoading(true);
    const result = await duplicateProduct(productId);
    if (result.success) {
      setFeedback({ type: "success", message: `Duplicated as "${result.product?.name}"` });
      router.refresh();
    } else {
      setFeedback({ type: "error", message: result.error || "Duplicate failed." });
    }
    setLoading(false);
  }

  function startInlineEdit(product: Product) {
    setEditingProductId(product.id);
    setEditPrice(product.price.toString());
    setEditDiscountPrice(product.discountPrice?.toString() || "");
  }

  async function handleSavePrice(productId: string) {
    const priceVal = parseFloat(editPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      setFeedback({ type: "error", message: "Please enter a valid price." });
      return;
    }

    const discountVal = editDiscountPrice ? parseFloat(editDiscountPrice) : null;
    if (discountVal !== null && (isNaN(discountVal) || discountVal < 0)) {
      setFeedback({ type: "error", message: "Please enter a valid discount price." });
      return;
    }

    setIsSavingPrice(true);
    try {
      const result = await updateProductPriceDirect(productId, priceVal, discountVal);
      if (result.success) {
        setFeedback({ type: "success", message: "Price updated successfully." });
        
        // Update localProducts state instantly
        setLocalProducts(prev => prev.map(item => {
          if (item.id === productId) {
            return {
              ...item,
              price: priceVal,
              discountPrice: discountVal
            };
          }
          return item;
        }));
        
        setEditingProductId(null);
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error || "Failed to update price." });
      }
    } catch (e: any) {
      setFeedback({ type: "error", message: e.message || "An error occurred." });
    }
    setIsSavingPrice(false);
  }

  const totalProducts = localProducts.length;
  const activeProducts = localProducts.filter(p => p.status === "ACTIVE").length;
  const draftProducts = localProducts.filter(p => p.status === "DRAFT").length;
  const lowStockProducts = localProducts.filter(p => p.stock < 10).length;

  return (
    <div>
      <style>{`
        .price-edit-cell:hover .edit-pencil-btn {
          opacity: 0.65 !important;
        }
        .price-edit-cell .edit-pencil-btn:hover {
          opacity: 1 !important;
        }
      `}</style>
      {/* Feedback Toast */}
      {feedback && (
        <div style={{
          position: "fixed", top: "1.5rem", right: "1.5rem", zIndex: 9999,
          padding: "0.85rem 1.25rem", borderRadius: "10px", fontSize: "0.875rem", fontWeight: 600,
          background: feedback.type === "success" ? "#059669" : "#dc2626",
          color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex", alignItems: "center", gap: "0.75rem",
          animation: "fadeInDown 0.25s ease-out",
          maxWidth: "420px"
        }}>
          {feedback.message}
          <button onClick={() => setFeedback(null)} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "2px", lineHeight: 1 }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Quick Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <div className="card" style={{ padding: "1.15rem", display: "flex", alignItems: "center", gap: "0.875rem", borderLeft: "4px solid var(--brand-primary)" }}>
          <div style={{ padding: "0.45rem", background: "var(--brand-glow)", borderRadius: "var(--radius-md)", color: "var(--brand-primary)" }}>
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>{totalProducts}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Total</div>
          </div>
        </div>
        <div className="card" style={{ padding: "1.15rem", display: "flex", alignItems: "center", gap: "0.875rem", borderLeft: "4px solid var(--success)" }}>
          <div style={{ padding: "0.45rem", background: "rgba(16, 185, 129, 0.1)", borderRadius: "var(--radius-md)", color: "var(--success)" }}>
            <Boxes size={20} />
          </div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>{activeProducts}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Active</div>
          </div>
        </div>
        <div className="card" style={{ padding: "1.15rem", display: "flex", alignItems: "center", gap: "0.875rem", borderLeft: "4px solid #a78bfa" }}>
          <div style={{ padding: "0.45rem", background: "rgba(167, 139, 250, 0.1)", borderRadius: "var(--radius-md)", color: "#7c3aed" }}>
            <Archive size={20} />
          </div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>{draftProducts}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Draft</div>
          </div>
        </div>
        <div className="card" style={{ padding: "1.15rem", display: "flex", alignItems: "center", gap: "0.875rem", borderLeft: "4px solid var(--danger)" }}>
          <div style={{ padding: "0.45rem", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", color: "var(--danger)" }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>{lowStockProducts}</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Low Stock</div>
          </div>
        </div>
      </div>

      {/* Interactive HTML5 Canvas Telemetry Selector Map */}
      <div style={{ marginBottom: "1.5rem" }}>
        <ProductCatalogCanvas
          products={filteredProducts}
          selected={selected}
          onToggle={toggleOne}
          onSelectRange={(ids, clearOthers) => {
            if (clearOthers) {
              setSelected(new Set(ids));
            } else {
              const next = new Set(selected);
              ids.forEach(id => next.add(id));
              setSelected(next);
            }
          }}
          currencySymbol={currencySymbol}
        />
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {/* Toolbar */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", gap: "0.75rem", background: "#ffffff", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "180px", display: "flex", alignItems: "center", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.45rem 0.875rem" }}>
            <Search size={16} color="var(--text-muted)" style={{ marginRight: "0.5rem", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Search by SKU or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.85rem" }}
            />
          </div>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {searchQuery ? (
              <span>Found <strong>{filteredProducts.length}</strong> of <strong>{totalProducts}</strong></span>
            ) : (
              <span><strong>{totalProducts}</strong> product{totalProducts !== 1 ? "s" : ""}</span>
            )}
          </div>
        </div>

        {/* Bulk Actions Bar — slides in when items selected */}
        {selected.size > 0 && (
          <div style={{
            padding: "0.75rem 1.5rem",
            background: "linear-gradient(135deg, #1e293b 0%, #334155 100%)",
            display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            animation: "fadeInDown 0.2s ease-out"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#ffffff", fontSize: "0.875rem", fontWeight: 600 }}>
              <CheckSquare size={18} />
              {selected.size} selected
            </div>

            <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.2)" }} />

            {/* Bulk action selector */}
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              style={{
                padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem",
                border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.1)",
                color: "#ffffff", cursor: "pointer", outline: "none", minWidth: "180px"
              }}
            >
              <option value="" style={{ color: "#1e293b" }}>Choose bulk action...</option>
              <optgroup label="Status" style={{ color: "#1e293b" }}>
                <option value="status_active" style={{ color: "#1e293b" }}>Set Active</option>
                <option value="status_draft" style={{ color: "#1e293b" }}>Set Draft</option>
                <option value="status_oos" style={{ color: "#1e293b" }}>Set Out of Stock</option>
              </optgroup>
              <optgroup label="Update" style={{ color: "#1e293b" }}>
                <option value="update_price" style={{ color: "#1e293b" }}>Update Price</option>
                <option value="update_stock" style={{ color: "#1e293b" }}>Update Stock</option>
                <option value="update_category" style={{ color: "#1e293b" }}>Change Category</option>
                <option value="fast_dispatch_enable" style={{ color: "#1e293b" }}>Enable Fast Dispatch</option>
                <option value="fast_dispatch_disable" style={{ color: "#1e293b" }}>Disable Fast Dispatch</option>
              </optgroup>
              <optgroup label="Danger" style={{ color: "#1e293b" }}>
                <option value="delete" style={{ color: "#dc2626" }}>Delete Selected</option>
              </optgroup>
            </select>

            <button
              onClick={executeBulkAction}
              disabled={!bulkAction || loading}
              style={{
                padding: "0.45rem 1.25rem", borderRadius: "6px", fontSize: "0.85rem",
                fontWeight: 600, border: "none", cursor: bulkAction ? "pointer" : "not-allowed",
                background: bulkAction ? (bulkAction === "delete" ? "#dc2626" : "#3b82f6") : "rgba(255,255,255,0.15)",
                color: "#ffffff", transition: "all 0.15s",
                opacity: bulkAction ? 1 : 0.5,
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}
            >
              {loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
              Apply
            </button>

            <button
              onClick={() => { setSelected(new Set()); setBulkAction(""); }}
              style={{
                padding: "0.45rem 0.75rem", borderRadius: "6px", fontSize: "0.85rem",
                border: "1px solid rgba(255,255,255,0.2)", background: "transparent",
                color: "rgba(255,255,255,0.7)", cursor: "pointer", marginLeft: "auto"
              }}
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Data Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.875rem 1.5rem", width: "50px" }}>
                  <div onClick={toggleAll} style={{ cursor: "pointer", display: "flex", alignItems: "center", color: "var(--text-secondary)" }}>
                    {allSelected ? <CheckSquare size={18} /> : someSelected ? <MinusSquare size={18} /> : <Square size={18} />}
                  </div>
                </th>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>SKU</th>
                <th style={thStyle}>Price</th>
                <th style={thStyle}>Discount Price / Expiry</th>
                <th style={thStyle}>Stock</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                    <Package size={40} color="var(--border-color)" />
                    <div style={{ fontSize: "1rem", fontWeight: 600 }}>No products found</div>
                    <div style={{ fontSize: "0.875rem" }}>Try adjusting your search query or criteria.</div>
                  </div>
                </td></tr>
              ) : (
                filteredProducts.map((p, index) => {
                  const isSelected = selected.has(p.id);
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: index < filteredProducts.length - 1 ? "1px solid var(--border-color)" : "none",
                        background: isSelected ? "rgba(59, 130, 246, 0.04)" : "#ffffff",
                        transition: "background 0.15s"
                      }}
                      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "#ffffff"; }}
                    >
                      <td style={{ padding: "0.875rem 1.5rem" }}>
                        <div
                          onClick={() => toggleOne(p.id)}
                          style={{ cursor: "pointer", display: "flex", alignItems: "center", color: isSelected ? "var(--brand-primary)" : "var(--text-muted)" }}
                        >
                          {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} style={{ width: "44px", height: "44px", objectFit: "cover", borderRadius: "8px", border: "1px solid var(--border-color)", flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: "44px", height: "44px", background: "var(--bg-tertiary)", borderRadius: "8px", border: "1px solid var(--border-color)", flexShrink: 0 }}></div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "220px" }}>{p.name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{p.category.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem" }}>
                        <code style={{ fontSize: "0.8rem", color: "var(--text-secondary)", background: "var(--bg-tertiary)", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>{p.sku}</code>
                      </td>
                      <td 
                        onClick={() => { if (enableInlineEditing && !editingProductId) startInlineEdit(p); }}
                        className={enableInlineEditing && !editingProductId ? "price-edit-cell" : ""}
                        style={{ padding: "0.875rem 1.5rem", cursor: enableInlineEditing && !editingProductId ? "pointer" : "default" }}
                        title={enableInlineEditing && !editingProductId ? "Click to edit pricing inline" : undefined}
                      >
                        {editingProductId === p.id ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{currencySymbol}</span>
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              disabled={isSavingPrice}
                              style={{
                                width: "80px",
                                padding: "0.35rem 0.5rem",
                                fontSize: "0.85rem",
                                border: "1px solid var(--border-color)",
                                borderRadius: "6px",
                                background: "#ffffff",
                                outline: "none",
                                fontWeight: 600
                              }}
                              placeholder="Price"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                            {p.discountPrice !== null && p.discountPrice !== undefined && (!p.discountEndDate || new Date(p.discountEndDate) >= new Date()) ? (
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ textDecoration: "line-through", color: "var(--text-muted)", fontSize: "0.75rem", fontWeight: 400 }}>
                                  {currencySymbol}{p.price.toFixed(2)}
                                </span>
                                <span style={{ color: "var(--brand-primary)", fontWeight: 700 }}>
                                  {currencySymbol}{p.discountPrice.toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{currencySymbol}{p.price.toFixed(2)}</span>
                            )}
                            {enableInlineEditing && !editingProductId && (
                              <Edit size={12} className="edit-pencil-btn" style={{ opacity: 0, transition: "opacity 0.2s", color: "var(--brand-primary)", flexShrink: 0 }} />
                            )}
                          </div>
                        )}
                      </td>
                      <td 
                        onClick={() => { if (enableInlineEditing && !editingProductId) startInlineEdit(p); }}
                        className={enableInlineEditing && !editingProductId ? "price-edit-cell" : ""}
                        style={{ padding: "0.875rem 1.5rem", cursor: enableInlineEditing && !editingProductId ? "pointer" : "default" }}
                        title={enableInlineEditing && !editingProductId ? "Click to edit pricing inline" : undefined}
                      >
                        {editingProductId === p.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>{currencySymbol}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={editDiscountPrice}
                                onChange={(e) => setEditDiscountPrice(e.target.value)}
                                disabled={isSavingPrice}
                                style={{
                                  width: "80px",
                                  padding: "0.35rem 0.5rem",
                                  fontSize: "0.85rem",
                                  border: "1px solid var(--border-color)",
                                  borderRadius: "6px",
                                  background: "#ffffff",
                                  outline: "none",
                                  fontWeight: 600
                                }}
                                placeholder="None"
                              />
                            </div>
                            {p.discountEndDate && (
                              <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>
                                Expiry unchanged
                              </span>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                            {p.discountPrice !== null && p.discountPrice !== undefined ? (
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                                <span style={{ fontWeight: 700, color: "var(--brand-primary)", fontSize: "0.9rem" }}>
                                  {currencySymbol}{p.discountPrice.toFixed(2)}
                                </span>
                                {p.discountEndDate ? (
                                  <span style={{ fontSize: "0.7rem", color: new Date(p.discountEndDate) < new Date() ? "var(--danger)" : "var(--success)", fontWeight: 500 }}>
                                    {new Date(p.discountEndDate) < new Date() ? "Expired: " : "Expires: "}
                                    {new Date(p.discountEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>No Expiry Date</span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>—</span>
                            )}
                            {enableInlineEditing && !editingProductId && (
                              <Edit size={12} className="edit-pencil-btn" style={{ opacity: 0, transition: "opacity 0.2s", color: "var(--brand-primary)", flexShrink: 0 }} />
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: "36px", height: "5px", borderRadius: "3px", background: "var(--bg-tertiary)", overflow: "hidden", flexShrink: 0 }}>
                            <div style={{
                              width: `${Math.min(100, (p.stock / 100) * 100)}%`, height: "100%", borderRadius: "3px",
                              background: p.stock < 10 ? "var(--danger)" : p.stock < 30 ? "#f59e0b" : "var(--success)",
                            }} />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: "0.85rem", color: p.stock < 10 ? "var(--danger)" : "var(--text-primary)" }}>
                            {p.stock}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem" }}>
                        <span style={{
                          display: "inline-block", padding: "0.25rem 0.7rem", borderRadius: "20px", fontSize: "0.72rem",
                          fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em",
                          background: p.status === "ACTIVE" ? "rgba(16, 185, 129, 0.1)" : p.status === "DRAFT" ? "rgba(167, 139, 250, 0.1)" : "rgba(239, 68, 68, 0.1)",
                          color: p.status === "ACTIVE" ? "var(--success)" : p.status === "DRAFT" ? "#7c3aed" : "var(--danger)",
                        }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.5rem", textAlign: "right" }}>
                        {editingProductId === p.id ? (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem" }}>
                            <button
                              onClick={() => handleSavePrice(p.id)}
                              disabled={isSavingPrice}
                              className="btn btn-primary"
                              title="Save Changes"
                              style={{
                                padding: "0.35rem 0.65rem",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                                fontSize: "0.75rem",
                                background: "var(--success)",
                                color: "#ffffff",
                                border: "none"
                              }}
                            >
                              {isSavingPrice ? (
                                <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                              ) : (
                                "Save"
                              )}
                            </button>
                            <button
                              onClick={() => setEditingProductId(null)}
                              disabled={isSavingPrice}
                              className="btn btn-outline"
                              title="Cancel"
                              style={{
                                padding: "0.35rem 0.65rem",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.25rem",
                                fontSize: "0.75rem"
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.4rem", position: "relative" }}>
                            <Link href={`/admin/products/${p.id}/edit`} className="btn btn-outline"
                              style={{ padding: "0.35rem 0.45rem", background: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                              <Edit size={15} />
                            </Link>
                            <button
                              onClick={(e) => { e.stopPropagation(); setRowMenuOpen(rowMenuOpen === p.id ? null : p.id); }}
                              className="btn btn-outline"
                              style={{
                                padding: "0.35rem 0.45rem", background: rowMenuOpen === p.id ? "var(--bg-tertiary)" : "#ffffff",
                                color: "var(--text-muted)", borderColor: rowMenuOpen === p.id ? "var(--border-color)" : "transparent"
                              }}
                            >
                              <MoreVertical size={15} />
                            </button>

                            {rowMenuOpen === p.id && (
                              <div onClick={(e) => e.stopPropagation()} style={{
                                position: "absolute", top: "calc(100% + 4px)", right: 0, background: "#ffffff",
                                border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: "170px", zIndex: 100, overflow: "hidden",
                                animation: "fadeInDown 0.15s ease-out"
                              }}>
                                <button onClick={() => { setRowMenuOpen(null); handleRowDuplicate(p.id); }}
                                  style={menuItemStyle}
                                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                  <Copy size={15} color="var(--brand-primary)" /> Duplicate
                                </button>
                                <div style={{ height: "1px", background: "var(--border-color)" }} />
                                <button onClick={() => { setRowMenuOpen(null); handleRowDelete(p.id, p.name); }}
                                  style={{ ...menuItemStyle, color: "var(--danger)" }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}
                                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                >
                                  <Trash2 size={15} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Price / Stock Modal */}
      {bulkModal && bulkModal !== "category" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeInDown 0.2s ease-out"
        }} onClick={() => { setBulkModal(null); setModalValue(""); setModalMode("set"); }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#ffffff", borderRadius: "16px", padding: "2rem",
            width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.15rem", fontWeight: 700 }}>
              {bulkModal === "price" ? "Bulk Update Price" : "Bulk Update Stock"}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
              Applying to <strong>{selected.size}</strong> selected product{selected.size > 1 ? "s" : ""}
            </p>

            {/* Mode selector */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              {(bulkModal === "price"
                ? [
                    { key: "set", label: "Set to" },
                    { key: "adjust_percent", label: "Adjust %" },
                    { key: "adjust_fixed", label: `Adjust ${currencySymbol}` },
                  ]
                : [
                    { key: "set", label: "Set to" },
                    { key: "adjust", label: "Adjust by" },
                  ]
              ).map(m => (
                <button
                  key={m.key}
                  onClick={() => setModalMode(m.key)}
                  style={{
                    flex: 1, padding: "0.55rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: 600,
                    border: "1px solid", cursor: "pointer", transition: "all 0.15s",
                    borderColor: modalMode === m.key ? "var(--brand-primary)" : "var(--border-color)",
                    background: modalMode === m.key ? "var(--brand-glow)" : "#ffffff",
                    color: modalMode === m.key ? "var(--brand-primary)" : "var(--text-secondary)",
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Value input */}
            <div style={{
              display: "flex", alignItems: "center", border: "1px solid var(--border-color)",
              borderRadius: "8px", overflow: "hidden", marginBottom: "1.5rem"
            }}>
              <div style={{ padding: "0.75rem", background: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 600, borderRight: "1px solid var(--border-color)" }}>
                {bulkModal === "price" ? (modalMode === "adjust_percent" ? "%" : currencySymbol) : "#"}
              </div>
              <input
                type="number"
                value={modalValue}
                onChange={(e) => setModalValue(e.target.value)}
                placeholder={modalMode === "set" ? "Enter value..." : "e.g. 10 or -5"}
                style={{ flex: 1, padding: "0.75rem", border: "none", outline: "none", fontSize: "0.95rem" }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => { setBulkModal(null); setModalValue(""); setModalMode("set"); }}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600,
                  border: "1px solid var(--border-color)", background: "#ffffff", color: "var(--text-secondary)", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitModal}
                disabled={loading || !modalValue}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600,
                  border: "none", background: "var(--brand-primary)", color: "#ffffff", cursor: "pointer",
                  opacity: loading || !modalValue ? 0.6 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Category Modal */}
      {bulkModal === "category" && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeInDown 0.2s ease-out"
        }} onClick={() => { setBulkModal(null); }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#ffffff", borderRadius: "16px", padding: "2rem",
            width: "100%", maxWidth: "420px", boxShadow: "0 24px 64px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.15rem", fontWeight: 700 }}>
              Bulk Change Category
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 1.5rem 0" }}>
              Applying to <strong>{selected.size}</strong> selected product{selected.size > 1 ? "s" : ""}
            </p>

            {/* Category dropdown */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                Select Target Category
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                style={{
                  width: "100%", padding: "0.75rem", borderRadius: "8px",
                  border: "1px solid var(--border-color)", background: "#ffffff",
                  fontSize: "0.95rem", outline: "none", cursor: "pointer"
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => { setBulkModal(null); }}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600,
                  border: "1px solid var(--border-color)", background: "#ffffff", color: "var(--text-secondary)", cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={submitCategoryModal}
                disabled={loading || !selectedCategoryId}
                style={{
                  flex: 1, padding: "0.7rem", borderRadius: "8px", fontSize: "0.875rem", fontWeight: 600,
                  border: "none", background: "var(--brand-primary)", color: "#ffffff", cursor: "pointer",
                  opacity: loading || !selectedCategoryId ? 0.6 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem"
                }}
              >
                {loading && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "0.875rem 1.5rem",
  fontSize: "0.8rem",
  fontWeight: 700,
  color: "var(--text-secondary)",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.7rem",
  padding: "0.7rem 1rem",
  width: "100%",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 500,
  color: "var(--text-primary)",
  transition: "background 0.15s",
};
