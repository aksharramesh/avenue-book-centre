"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, ShoppingBag, Plus, Minus, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface ProductActionsProps {
  product: {
    id: string;
    name: string;
    price: number;
    discountPrice?: number | null;
    discountEndDate?: string | Date | null;
    imageUrl: string | null;
    sku: string;
    stock: number;
    weight: number;
    categoryId: string;
  };
}

export default function ProductActions({ product }: ProductActionsProps) {
  const router = useRouter();
  const { addToCart, showBuyButtons } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!showBuyButtons) return null;

  const getEffectivePrice = () => {
    if (product.discountPrice !== null && product.discountPrice !== undefined) {
      if (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) {
        return product.discountPrice;
      }
    }
    return product.price;
  };

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      ...product,
      price: getEffectivePrice()
    }, quantity);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 3000);
  };

  const handleBuyNow = () => {
    addToCart({
      ...product,
      price: getEffectivePrice()
    }, quantity);
    router.push("/checkout");
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1rem" }}>
      {/* Quantity Selector */}
      {!isOutOfStock && (
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)" }}>
            Quantity:
          </span>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              overflow: "hidden",
              width: "120px",
            }}
          >
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1}
              style={{
                padding: "0.5rem 0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: quantity <= 1 ? "var(--text-muted)" : "var(--text-secondary)",
                width: "35px",
                background: "transparent",
              }}
              type="button"
              aria-label="Decrease quantity"
            >
              <Minus size={14} />
            </button>
            <span
              style={{
                flexGrow: 1,
                textAlign: "center",
                fontWeight: 600,
                fontSize: "0.95rem",
                userSelect: "none",
              }}
            >
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= product.stock}
              style={{
                padding: "0.5rem 0.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: quantity >= product.stock ? "var(--text-muted)" : "var(--text-secondary)",
                width: "35px",
                background: "transparent",
              }}
              type="button"
              aria-label="Increase quantity"
            >
              <Plus size={14} />
            </button>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            ({product.stock} units available)
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className="btn"
          style={{
            padding: "1.1rem",
            fontSize: "1.05rem",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            background: added ? "var(--success)" : "var(--brand-secondary)",
            color: "#ffffff",
            borderRadius: "var(--radius-md)",
            fontWeight: 700,
            boxShadow: added ? "0 4px 14px rgba(16, 185, 129, 0.2)" : "0 4px 14px var(--brand-glow)",
            transition: "all 0.3s ease",
          }}
          type="button"
        >
          {added ? (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Check size={18} strokeWidth={3} /> Added to Cart!
            </span>
          ) : (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShoppingCart size={18} /> Add to Cart
            </span>
          )}
        </button>

        <button
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className="btn btn-primary"
          style={{
            padding: "1.1rem",
            fontSize: "1.05rem",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            fontWeight: 700,
            background: isOutOfStock ? "var(--border-color)" : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", /* Golden/Orange gradient like Amazon's Buy Now */
            boxShadow: isOutOfStock ? "none" : "0 4px 14px rgba(245, 158, 11, 0.2)",
            color: "#ffffff",
            border: "none",
          }}
          type="button"
        >
          <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={18} /> Buy Now
          </span>
        </button>
      </div>
    </div>
  );
}
