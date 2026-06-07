"use client";

import { useCart } from "@/context/CartContext";
import { X, Trash2, Plus, Minus, ShoppingBag, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getCurrencySettings } from "@/app/actions";

export default function MiniCartDrawer() {
  const {
    cart,
    cartSubtotal,
    cartCount,
    cartWeight,
    isDrawerOpen,
    setIsDrawerOpen,
    removeFromCart,
    updateQuantity
  } = useCart();

  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    getCurrencySettings().then(res => {
      setCurrencySymbol(res.symbol);
    });
  }, [isDrawerOpen]);

  // Prevent background scrolling when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      zIndex: 9999,
      display: "flex",
      justifyContent: "flex-end"
    }}>
      {/* Backdrop Dimmer */}
      <div 
        onClick={() => setIsDrawerOpen(false)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          animation: "fade-in 0.3s ease",
          zIndex: 1
        }}
      />

      {/* Drawer Body Panel */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "460px",
        height: "100%",
        background: "#ffffff",
        boxShadow: "-10px 0 30px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        zIndex: 2,
        animation: "slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Header Block */}
        <div style={{
          padding: "1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-secondary)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={20} color="var(--brand-primary)" />
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
              Shopping Cart ({cartCount})
            </h3>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0.5rem",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              transition: "background 0.2s"
            }}
            className="btn-close-hover"
            aria-label="Close cart drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart Items List */}
        <div style={{
          flexGrow: 1,
          overflowY: "auto",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem"
        }}>
          {cart.length === 0 ? (
            <div style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "1rem",
              color: "var(--text-muted)",
              textAlign: "center"
            }}>
              <ShoppingBag size={48} strokeWidth={1.5} style={{ opacity: 0.5 }} />
              <div>
                <h4 style={{ margin: "0 0 0.25rem 0", color: "var(--text-primary)", fontWeight: 700 }}>Your cart is empty</h4>
                <p style={{ margin: 0, fontSize: "0.85rem" }}>Explore our catalog to find corporate selections.</p>
              </div>
              <Link 
                href="/products" 
                onClick={() => setIsDrawerOpen(false)}
                className="btn btn-primary"
                style={{ padding: "0.6rem 1.5rem", fontSize: "0.875rem", marginTop: "0.5rem" }}
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.productId}
                style={{
                  display: "flex",
                  gap: "1rem",
                  paddingBottom: "1.25rem",
                  borderBottom: "1px solid var(--border-color)",
                  alignItems: "center"
                }}
              >
                {/* Thumbnail */}
                <div style={{
                  position: "relative",
                  width: "60px",
                  height: "75px",
                  background: "var(--bg-tertiary)",
                  borderRadius: "6px",
                  overflow: "hidden",
                  flexShrink: 0,
                  border: "1px solid var(--border-color)"
                }}>
                  <img
                    src={item.imageUrl || "/placeholder.jpg"}
                    alt={item.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: "0.95rem",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis"
                  }}>
                    {item.name}
                  </h4>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "monospace" }}>
                    SKU: {item.sku}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                    {/* Quantity controls */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid var(--border-color)",
                      borderRadius: "4px",
                      background: "var(--bg-secondary)"
                    }}>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0.5rem", display: "flex", alignItems: "center" }}
                        type="button"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: "0.85rem", fontWeight: 700, padding: "0 0.5rem", minWidth: "16px", textAlign: "center" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: "0.25rem 0.5rem", display: "flex", alignItems: "center" }}
                        type="button"
                        aria-label="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Price & Weight */}
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                      </span>
                      <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {(item.weight * item.quantity).toFixed(2)} kg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Remove item */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--danger)",
                    padding: "0.5rem",
                    borderRadius: "4px"
                  }}
                  title="Remove item"
                  aria-label={`Remove ${item.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Billing Block */}
        {cart.length > 0 && (
          <div style={{
            padding: "2rem 1.5rem",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem"
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                <span>Total Weight:</span>
                <span style={{ fontWeight: 600 }}>{cartWeight.toFixed(2)} kg</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                <span>Subtotal Value:</span>
                <span style={{ color: "var(--brand-dark)", fontSize: "1.3rem" }}>
                  {currencySymbol}{cartSubtotal.toFixed(2)}
                </span>
              </div>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginTop: "0.25rem" }}>
                * Shipping delivery charges and sales taxes are calculated at checkout.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <Link
                href="/checkout"
                onClick={() => setIsDrawerOpen(false)}
                className="btn btn-primary animate-pulse-subtle"
                style={{
                  padding: "1rem",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "0.5rem",
                  width: "100%",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // Matches Amazon yellow checkout
                  border: "none",
                  boxShadow: "0 4px 14px rgba(245, 158, 11, 0.25)",
                  color: "#ffffff"
                }}
              >
                <CreditCard size={18} />
                Proceed to Checkout
                <ArrowRight size={16} />
              </Link>

              <Link
                href="/cart"
                onClick={() => setIsDrawerOpen(false)}
                className="btn btn-outline"
                style={{
                  padding: "0.85rem",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  display: "flex",
                  justifyContent: "center",
                  width: "100%",
                  background: "#ffffff"
                }}
              >
                View Full Cart Details
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
