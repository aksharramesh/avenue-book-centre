"use client";

import { useState } from "react";
import { Percent, Tag, Sliders, CheckSquare, Plus, Save } from "lucide-react";

interface TaxOverrideFormProps {
  categories: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; sku: string }>;
  currencySymbol: string;
  addRuleAction: (formData: FormData) => Promise<void>;
}

export default function TaxOverrideForm({ categories, products, currencySymbol, addRuleAction }: TaxOverrideFormProps) {
  const [targetType, setTargetType] = useState<"CATEGORY" | "PRODUCT">("CATEGORY");
  const [targetId, setTargetId] = useState("");
  const [type, setType] = useState<"PERCENT" | "AMOUNT">("PERCENT");
  const [value, setValue] = useState("");

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // We let Next.js handle the standard form action under the hood
    if (!targetId || !value) {
      e.preventDefault();
      alert("Please select a target and enter a numeric tax rate value.");
    }
  };

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid var(--border-color)",
      borderRadius: "var(--radius-lg)",
      padding: "2rem",
      boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
    }}>
      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <Plus size={18} color="var(--brand-primary)" />
        Create Customized Override Rule
      </h3>
      <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
        Configure a custom sales tax surcharge mapped to a Category or Product.
      </p>

      <form action={addRuleAction} onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Target Type Selector */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Override Target *</label>
          <div style={{ display: "flex", gap: "1rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: targetType === "CATEGORY" ? 700 : 500 }}>
              <input 
                type="radio" 
                name="targetType" 
                value="CATEGORY"
                checked={targetType === "CATEGORY"}
                onChange={() => { setTargetType("CATEGORY"); setTargetId(""); }}
                style={{ accentColor: "var(--brand-primary)", width: "16px", height: "16px" }}
              />
              Category Override
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", cursor: "pointer", fontWeight: targetType === "PRODUCT" ? 700 : 500 }}>
              <input 
                type="radio" 
                name="targetType" 
                value="PRODUCT"
                checked={targetType === "PRODUCT"}
                onChange={() => { setTargetType("PRODUCT"); setTargetId(""); }}
                style={{ accentColor: "var(--brand-primary)", width: "16px", height: "16px" }}
              />
              Product Override
            </label>
          </div>
        </div>

        {/* Dynamic Selector dropdown based on target selection */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Select {targetType === "CATEGORY" ? "Category" : "Product"} *
          </label>
          
          <select 
            name="targetId" 
            required 
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="input-base" 
            style={{ width: "100%", padding: "0.6rem" }}
          >
            <option value="">-- Choose {targetType === "CATEGORY" ? "Category" : "Product"} --</option>
            {targetType === "CATEGORY" ? (
              categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))
            ) : (
              products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
              ))
            )}
          </select>
        </div>

        {/* Tax type option */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Calculation Method *</label>
          <select 
            name="type" 
            required
            value={type}
            onChange={(e) => setType(e.target.value as "PERCENT" | "AMOUNT")}
            className="input-base" 
            style={{ width: "100%", padding: "0.6rem" }}
          >
            <option value="PERCENT">Percentage Rate (%)</option>
            <option value="AMOUNT">Fixed Surcharge amount ({currencySymbol})</option>
          </select>
        </div>

        {/* Tax Override Numeric value */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>
            Override Value ({type === "PERCENT" ? "%" : currencySymbol}) *
          </label>
          <input 
            type="number" 
            name="value" 
            required 
            step="0.01" 
            min="0" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={type === "PERCENT" ? "12.00" : "15.00"}
            className="input-base" 
            style={{ width: "100%", padding: "0.6rem" }} 
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {type === "PERCENT" 
              ? "Calculated as a percentage of the items subtotal after coupon reductions." 
              : `Applies as a flat cash surcharge multiplied directly by the items order quantity.`
            }
          </span>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ 
            padding: "0.75rem", 
            fontWeight: 700, 
            width: "100%", 
            display: "flex", 
            alignItems: "center", 
            gap: "0.5rem", 
            justifyContent: "center", 
            marginTop: "0.5rem" 
          }}
        >
          <Save size={16} />
          Deploy Override Rule
        </button>
      </form>
    </div>
  );
}
