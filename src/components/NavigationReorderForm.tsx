"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Save, Loader2, GripVertical, CheckSquare } from "lucide-react";

interface NavigationReorderFormProps {
  initialOrder: string[];
  saveAction: (orderArray: string[]) => Promise<void>;
}

const MENU_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  reports: "Reports & Analytics",
  customers: "Customer Directory",
  settings: "Settings Collapsible dropdown Menu",
  products: "Product Management",
  categories: "Category Management",
  orders: "Order Management"
};

export default function NavigationReorderForm({ initialOrder, saveAction }: NavigationReorderFormProps) {
  const [order, setOrder] = useState<string[]>(initialOrder);
  const [isPending, startTransition] = useTransition();

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...order];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    setOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === order.length - 1) return;
    const newOrder = [...order];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    setOrder(newOrder);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await saveAction(order);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: "2rem", display: "flex", flexDirection: "column", gap: "1.5rem", background: "#ffffff" }}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <CheckSquare size={18} color="var(--brand-primary)" />
        Reorder Menu Items
      </h3>
      <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
        Rearrange items in the list below. Link positions in the sidebar menu will automatically synchronize.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {order.map((item, index) => (
          <div
            key={item}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <GripVertical size={16} color="var(--text-muted)" style={{ cursor: "ns-resize" }} />
              <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)" }}>
                {MENU_LABELS[item] || item}
              </span>
            </div>

            <div style={{ display: "flex", gap: "0.35rem" }}>
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0 || isPending}
                className="btn btn-outline"
                style={{
                  padding: "0.35rem",
                  borderRadius: "4px",
                  cursor: index === 0 ? "not-allowed" : "pointer",
                  opacity: index === 0 ? 0.3 : 1
                }}
                title="Move Up"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === order.length - 1 || isPending}
                className="btn btn-outline"
                style={{
                  padding: "0.35rem",
                  borderRadius: "4px",
                  cursor: index === order.length - 1 ? "not-allowed" : "pointer",
                  opacity: index === order.length - 1 ? 0.3 : 1
                }}
                title="Move Down"
              >
                <ArrowDown size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn btn-primary"
        style={{
          width: "100%",
          padding: "0.85rem",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          justifyContent: "center",
          marginTop: "0.5rem"
        }}
      >
        {isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
            <span>Deploying Layout Order...</span>
          </>
        ) : (
          <>
            <Save size={16} />
            <span>Save Custom Menu Order</span>
          </>
        )}
      </button>
    </form>
  );
}
