"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowRight, Trash2, Plus, Minus, ArrowLeft, ShieldCheck, Tag, X, Scale } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getCurrencySettings } from "@/app/actions";

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartCount,
    cartWeight,
    couponCode,
    discountAmount,
    shippingCost,
    taxCost,
    orderTotal,
    applyCoupon,
    removeCoupon,
    isLoaded,
    globalTaxRate
  } = useCart();

  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [applying, setApplying] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    document.title = "Shopping Cart | Avenue Book Centre";
    getCurrencySettings().then(settings => {
      setCurrencySymbol(settings.symbol);
    });
  }, []);

  if (!isLoaded) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-muted" style={{ fontSize: "1.1rem" }}>Loading your cart...</p>
      </div>
    );
  }

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError("");
    setPromoSuccess("");
    
    if (!promoInput.trim()) return;
    
    setApplying(true);
    const res = await applyCoupon(promoInput);
    setApplying(false);

    if (res.success) {
      setPromoSuccess(res.message);
      setPromoInput("");
    } else {
      setPromoError(res.message);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setPromoSuccess("");
    setPromoError("");
  };

  // E-commerce messaging
  const FREE_SHIPPING_THRESHOLD = 100;
  const isFreeShipping = shippingCost === 0;
  const remainingForFreeShipping = FREE_SHIPPING_THRESHOLD - (cartSubtotal - discountAmount);

  if (cart.length === 0) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "4rem 1.5rem" }}>
        <div className="container" style={{ maxWidth: "600px", textAlign: "center", padding: "4rem 2rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "80px", height: "80px", borderRadius: "50%", background: "var(--brand-glow)", color: "var(--brand-primary)", marginBottom: "1.5rem" }}>
            <ShoppingCart size={40} />
          </div>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Your Shopping Cart is empty</h1>
          <p className="text-muted" style={{ fontSize: "1.1rem", marginBottom: "2rem" }}>
            Before you can proceed to checkout, you must add some premium stationery or textbooks to your cart.
          </p>
          <Link href="/products" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
            <ArrowLeft size={18} /> Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "3rem 0 6rem 0" }}>
      <div className="container">
        <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", letterSpacing: "-0.02em" }}>Shopping Cart</h1>

        <div className="grid-responsive-3" style={{ gap: "2.5rem", alignItems: "start" }}>
          
          {/* Cart Items List */}
          <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Free Shipping Alert Bar like Amazon */}
            <div style={{
              background: isFreeShipping ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
              border: `1px solid ${isFreeShipping ? "var(--success)" : "rgba(245, 158, 11, 0.3)"}`,
              padding: "1rem 1.5rem",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.95rem",
              color: isFreeShipping ? "var(--success)" : "var(--text-primary)",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <ShieldCheck size={20} color={isFreeShipping ? "var(--success)" : "#f59e0b"} />
              {isFreeShipping ? (
                <span><strong>Congratulations!</strong> Your order qualifies for <strong>FREE Delivery</strong>.</span>
              ) : (
                <span>Add <strong>{currencySymbol}{remainingForFreeShipping.toFixed(2)}</strong> more of eligible items to get <strong>FREE Delivery</strong> (orders over {currencySymbol}100).</span>
              )}
            </div>

            {/* List Card */}
            <div className="card" style={{ padding: "1.5rem 2rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem", marginBottom: "1.5rem" }}>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.9rem" }}>Product details</span>
                <span style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: "0.9rem" }}>Price</span>
              </div>

              {cart.map((item) => (
                <div key={item.productId} style={{ display: "flex", gap: "1.5rem", padding: "1.5rem 0", borderBottom: "1px solid var(--border-color)", flexWrap: "wrap" }}>
                  {/* Thumbnail Image */}
                  <div style={{ position: "relative", width: "90px", height: "110px", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", overflow: "hidden", flexShrink: 0 }}>
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "contain", padding: "0.25rem" }}
                    />
                  </div>

                  {/* Details Block */}
                  <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: "200px" }}>
                    <div>
                      <h3 style={{ fontSize: "1.15rem", marginBottom: "0.25rem", lineHeight: "1.4" }}>
                        <Link href={`/products/${item.productId}`} style={{ color: "var(--text-primary)" }}>{item.name}</Link>
                      </h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center", fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "monospace", marginBottom: "0.5rem" }}>
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                          <Scale size={12} /> {item.weight} kg
                        </span>
                      </div>
                    </div>

                    {/* Quantity controls and delete button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginTop: "1rem" }}>
                      <div style={{ display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "8px", overflow: "hidden" }}>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          style={{ padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", color: "var(--text-secondary)", background: "transparent" }}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: "30px", textAlign: "center", fontWeight: 600, fontSize: "0.9rem" }}>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          style={{ padding: "0.4rem 0.6rem", display: "flex", alignItems: "center", color: "var(--text-secondary)", background: "transparent" }}
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", color: "var(--danger)", fontSize: "0.875rem", fontWeight: 600, background: "transparent" }}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    </div>
                  </div>

                  {/* Price Block */}
                  <div style={{ textAlign: "right", minWidth: "80px" }}>
                    <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--brand-dark)" }}>
                      {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                    </div>
                    {item.quantity > 1 && (
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                        ({currencySymbol}{item.price.toFixed(2)} each)
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", marginTop: "1rem", flexWrap: "wrap", gap: "1rem" }}>
                <Link href="/products" className="text-brand" style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ArrowLeft size={16} /> Continue Shopping
                </Link>
                
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                    Subtotal ({cartCount} items): <strong style={{ fontSize: "1.3rem", color: "var(--text-primary)" }}>{currencySymbol}{cartSubtotal.toFixed(2)}</strong>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                    <Scale size={14} /> Total Weight: <strong>{cartWeight.toFixed(2)} kg</strong>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Checkout Column - Subtotal summary card */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="cart-summary-col">
            
            {/* Promo Code Input Box */}
            <div className="card" style={{ padding: "1.5rem" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Tag size={16} color="var(--brand-primary)" /> Apply Promotional Coupon
              </h3>

              {!couponCode ? (
                <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10)"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    className="input-base"
                    style={{ padding: "0.6rem 1rem", fontSize: "0.9rem", flexGrow: 1 }}
                  />
                  <button
                    type="submit"
                    disabled={applying}
                    className="btn btn-primary"
                    style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
                  >
                    {applying ? "..." : "Apply"}
                  </button>
                </form>
              ) : (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(16, 185, 129, 0.05)", border: "1.5px solid var(--success)", padding: "0.75rem 1rem", borderRadius: "var(--radius-md)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Tag size={14} color="var(--success)" />
                    <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--success)" }}>{couponCode} APPLIED</span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    style={{ color: "var(--danger)", display: "flex", alignItems: "center", background: "transparent" }}
                    aria-label="Remove coupon"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {promoError && (
                <p style={{ color: "var(--danger)", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: 500 }}>
                  ⚠️ {promoError}
                </p>
              )}
              {promoSuccess && (
                <p style={{ color: "var(--success)", fontSize: "0.8rem", marginTop: "0.5rem", fontWeight: 600 }}>
                  ✓ {promoSuccess}
                </p>
              )}
              
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem", lineHeight: "1.4" }}>
                Try: <strong>WELCOME10</strong> (10% off), <strong>FLAT15</strong> ({currencySymbol}15 off &gt;{currencySymbol}75), or <strong>FREEHEAVY</strong> (Free shipping on weight &gt;3.0 kg).
              </div>
            </div>

            {/* Price Calculations */}
            <div className="card" style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "2rem" }}>
              <h2 style={{ fontSize: "1.35rem", marginBottom: "1.5rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>Order Summary</h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", fontSize: "0.95rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Subtotal ({cartCount} items):</span>
                  <span style={{ fontWeight: 600 }}>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)", fontWeight: 500 }}>
                    <span>Coupon Savings ({couponCode}):</span>
                    <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                    <span>Shipping & Handling ({cartWeight.toFixed(2)} kg):</span>
                    <span style={{ fontWeight: 600, color: isFreeShipping ? "var(--success)" : "var(--text-secondary)" }}>
                      {isFreeShipping ? "FREE" : `${currencySymbol}${shippingCost.toFixed(2)}`}
                    </span>
                  </div>
                  {!isFreeShipping && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "right" }}>
                      ({currencySymbol}4.99 base + {currencySymbol}1.99/additional kg)
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                  <span>Estimated Tax ({globalTaxRate}%):</span>
                  <span style={{ fontWeight: 600 }}>{currencySymbol}{taxCost.toFixed(2)}</span>
                </div>

                <div style={{ height: "1px", background: "var(--border-color)", margin: "0.5rem 0" }}></div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  <span>Total amount:</span>
                  <span style={{ color: "var(--brand-dark)" }}>{currencySymbol}{orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <div style={{ marginTop: "2rem" }}>
                <Link href="/checkout" className="btn btn-primary" style={{ width: "100%", padding: "1.1rem", fontSize: "1.1rem", display: "flex", justifyContent: "center", gap: "0.5rem", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", border: "none" }}>
                  Proceed to Checkout <ArrowRight size={18} />
                </Link>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.5rem", color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center", justifyContent: "center" }}>
                <ShieldCheck size={16} /> 256-bit Secure Transaction & Encrypted Delivery
              </div>
            </div>
            
            {/* Guarantee Box */}
            <div className="card" style={{ padding: "1.25rem 1.5rem", background: "var(--bg-tertiary)", border: "none" }}>
              <h3 style={{ fontSize: "0.95rem", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                🛡️ Avenue Book Centre Safe Buying Guarantee
              </h3>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                Get 100% refund protection if your items are damaged, incorrect, or delayed. Free standard returns on all B2C orders.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
