"use client";

import { useCart } from "@/context/CartContext";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useState } from "react";

interface HomeBuyButtonProps {
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

export default function HomeBuyButton({ product }: HomeBuyButtonProps) {
  const { addToCart, setIsDrawerOpen, showBuyButtons } = useCart();
  const [loading, setLoading] = useState(false);
  
  if (!showBuyButtons) return null;
  const [added, setAdded] = useState(false);

  const getEffectivePrice = () => {
    if (product.discountPrice !== null && product.discountPrice !== undefined) {
      if (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) {
        return product.discountPrice;
      }
    }
    return product.price;
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    setLoading(true);
    addToCart({
      id: product.id,
      name: product.name,
      price: getEffectivePrice(),
      imageUrl: product.imageUrl,
      sku: product.sku,
      weight: product.weight,
      categoryId: product.categoryId
    }, 1);

    setAdded(true);
    setIsDrawerOpen(true);
    setLoading(false);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  };

  const isOutOfStock = product.stock <= 0;

  return (
    <button
      onClick={handleBuy}
      disabled={isOutOfStock || loading}
      style={{
        padding: '0.5rem 1.1rem',
        borderRadius: '20px',
        background: isOutOfStock 
          ? 'var(--text-muted, #94a3b8)' 
          : 'linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)',
        color: '#ffffff',
        fontSize: '0.8rem',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        boxShadow: isOutOfStock ? 'none' : '0 4px 10px rgba(14, 165, 233, 0.2)',
        border: 'none',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s',
      }}
      type="button"
      title={isOutOfStock ? "Out of Stock" : "Add to Cart & Open Drawer"}
    >
      {isOutOfStock ? (
        "Out of Stock"
      ) : added ? (
        "Added!"
      ) : (
        <>
          Buy Now <ArrowRight size={12} />
        </>
      )}
    </button>
  );
}
