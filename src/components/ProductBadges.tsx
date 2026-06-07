import React from "react";
import { Sparkles, Flame, Award, Star, Percent, AlertCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  weight: number;
  fastDispatch: boolean;
  createdAt: Date;
  category?: {
    name: string;
  } | null;
}

interface Props {
  product: Product;
  position?: "absolute" | "relative";
}

export default function ProductBadges({ product, position = "absolute" }: Props) {
  const badges: { text: string; icon: any; gradient: string }[] = [];

  // Determine badges programmatically
  const isOutOfStock = product.stock === 0;

  if (isOutOfStock) {
    badges.push({
      text: "Out of Stock",
      icon: AlertCircle,
      gradient: "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
    });
  } else {
    // 1. Selling out fast: Stock is low (1 to 5 units)
    if (product.stock > 0 && product.stock <= 5) {
      badges.push({
        text: "Selling Fast",
        icon: Flame,
        gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
      });
    }

    // 2. New Releases: Created within last 30 days OR has a new-like SKU code
    const isNew = 
      (new Date().getTime() - new Date(product.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000) ||
      product.sku.startsWith("NEW") || 
      product.sku.includes("2026");
    if (isNew && badges.length < 2) {
      badges.push({
        text: "New Release",
        icon: Sparkles,
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      });
    }

    // 3. Top Sellers: Dynamic distribution based on SKU characteristics or fast dispatch
    const isTopSeller = 
      product.fastDispatch && 
      !isNew && 
      (product.sku.charCodeAt(product.sku.length - 1) % 2 === 0);
    if (isTopSeller && badges.length < 2) {
      badges.push({
        text: "Top Seller",
        icon: Award,
        gradient: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)"
      });
    }

    // 4. Must Buy: CBSE/ICSE curriculum textbooks or high stock values
    const isMustBuy = 
      (product.category?.name?.toLowerCase().includes("textbook") || 
       product.name.toLowerCase().includes("guide")) && 
      product.price > 300;
    if (isMustBuy && badges.length < 2) {
      badges.push({
        text: "Must Buy",
        icon: Star,
        gradient: "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)"
      });
    }

    // 5. Discount Challenge: Budget items under specific price tags
    const isDiscountChallenge = product.price <= 250;
    if (isDiscountChallenge && badges.length < 2) {
      badges.push({
        text: "Discount Challenge",
        icon: Percent,
        gradient: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)"
      });
    }

    // Fallback: If no badges are assigned, and it has fast dispatch, show Fast Dispatch badge
    if (badges.length === 0 && product.fastDispatch) {
      badges.push({
        text: "Fast Dispatch",
        icon: Sparkles,
        gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
      });
    }
  }

  if (badges.length === 0) return null;

  return (
    <div style={{
      position: position === "absolute" ? "absolute" : "static",
      top: position === "absolute" ? "12px" : "auto",
      left: position === "absolute" ? "12px" : "auto",
      zIndex: 10,
      display: "flex",
      flexDirection: "column",
      gap: "0.35rem",
      alignItems: "flex-start",
      pointerEvents: "none"
    }}>
      {badges.map((badge, idx) => {
        const Icon = badge.icon;
        return (
          <div
            key={idx}
            style={{
              background: badge.gradient,
              color: "#ffffff",
              padding: "0.3rem 0.65rem",
              borderRadius: "20px",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.03em",
              boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
              display: "flex",
              alignItems: "center",
              gap: "0.25rem",
              textTransform: "uppercase"
            }}
          >
            <Icon size={11} style={{ flexShrink: 0 }} />
            <span>{badge.text}</span>
          </div>
        );
      })}
    </div>
  );
}
