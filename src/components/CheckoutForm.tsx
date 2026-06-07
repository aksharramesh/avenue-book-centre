"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, CreditCard, Truck, ArrowLeft, AlertCircle, Scale, Tag, MapPin, Loader2, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { createOrder, getCurrencySettings, getCMSContent } from "@/app/actions";
import PaymentGateway from "@/components/PaymentGateway";

interface CheckoutFormProps {
  session: any; // NextAuth session passed from server page
}

export default function CheckoutForm({ session }: CheckoutFormProps) {
  const router = useRouter();
  const {
    cart,
    cartSubtotal,
    cartCount,
    cartWeight,
    couponCode,
    discountAmount,
    shippingCost,
    shippingCostIps,
    shippingCostAggregator,
    shippingMethod,
    setShippingMethod,
    zipCode,
    setZipCode,
    taxCost,
    orderTotal,
    clearCart,
    isLoaded,
    removeFromCart,
    globalTaxRate,
    shippingRules
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState<"success" | "fallback" | "">("");

  // Razorpay dynamic fallback state
  const [razorpayActive, setRazorpayActive] = useState("true");
  const [razorpayKeyId, setRazorpayKeyId] = useState("");

  // Address Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+91");
  const [phoneLocal, setPhoneLocal] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("India");
  const [zip, setZip] = useState("400001");

  // Autofill user details if logged in
  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setEmail(session.user.email || "");
      if ((session.user as any).phone) {
        const fullPhone = (session.user as any).phone;
        const parts = fullPhone.split(" ");
        if (parts.length >= 2) {
          setPhoneCode(parts[0]);
          setPhoneLocal(parts.slice(1).join(" "));
        } else if (fullPhone.startsWith("+")) {
          const matchedCode = ["+971", "+966", "+91", "+44", "+49", "+33", "+61", "+81", "+65", "+1"].find(c => fullPhone.startsWith(c));
          if (matchedCode) {
            setPhoneCode(matchedCode);
            setPhoneLocal(fullPhone.substring(matchedCode.length).trim());
          } else {
            setPhoneCode("+91");
            setPhoneLocal(fullPhone);
          }
        } else {
          setPhoneCode("+91");
          setPhoneLocal(fullPhone);
        }
      }
    }
  }, [session]);

  useEffect(() => {
    document.title = "Checkout | Avenue Book Centre";
  }, []);

  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    getCurrencySettings().then(res => {
      setCurrencySymbol(res.symbol);
    });

    getCMSContent("payment_razorpay_active").then(val => {
      if (val) setRazorpayActive(val);
    });

    getCMSContent("payment_razorpay_key_id").then(val => {
      if (val) setRazorpayKeyId(val);
    });
  }, []);

  useEffect(() => {
    setZipCode(zip);
  }, [zip, setZipCode]);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setDetecting(true);
    setError("");
    setLocationFeedback("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, {
            headers: {
              "Accept-Language": "en"
            }
          });

          if (!res.ok) throw new Error("Geocoding failed.");

          const data = await res.json();
          
          if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.suburb || addr.neighbourhood || data.display_name.split(",")[0] || "Detected Location";
            const cityName = addr.city || addr.town || addr.village || addr.state || "Mumbai";
            const countryName = addr.country || "India";
            const postcode = addr.postcode || "400001";

            setAddress(`${street}${addr.house_number ? `, No. ${addr.house_number}` : ""}`);
            setCity(cityName);
            setCountry(countryName);
            setZip(postcode);
            setLocationFeedback("success");
          } else {
            setAddress("Dharavi Main Road, Sector 3");
            setCity("Mumbai");
            setCountry("India");
            setZip("400017");
            setLocationFeedback("fallback");
          }
        } catch (err) {
          setAddress("Bandra West, Hill Road");
          setCity("Mumbai");
          setCountry("India");
          setZip("400050");
          setLocationFeedback("fallback");
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setAddress("Bandra West, Hill Road");
        setCity("Mumbai");
        setCountry("India");
        setZip("400050");
        setLocationFeedback("fallback");
        setDetecting(false);
      },
      { timeout: 10000 }
    );
  };

  if (!isLoaded) {
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p className="text-muted">Loading checkout details...</p>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-xl)", border: "1px solid var(--border-color)" }}>
        <h2 style={{ marginBottom: "1rem" }}>Your cart is empty</h2>
        <p className="text-muted" style={{ marginBottom: "2rem" }}>Add items to your cart before checking out.</p>
        <Link href="/products" className="btn btn-primary">Go to Catalog</Link>
      </div>
    );
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const combinedPhone = phoneLocal.trim() ? `${phoneCode} ${phoneLocal.trim()}` : "";
    const isPickup = shippingMethod === "PICKUP";

    if (isPickup) {
      if (!name || !email || !combinedPhone) {
        setError("Please fill out your name, email, and phone number.");
        return;
      }
    } else {
      if (!name || !email || !combinedPhone || !address || !city || !zip || !country) {
        setError("Please fill out all shipping fields including phone number.");
        return;
      }
    }

    if (phoneLocal.trim().length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);

    const isRealRazorpay = 
      razorpayActive === "true" && 
      razorpayKeyId && 
      !razorpayKeyId.includes("mock") && 
      !razorpayKeyId.includes("AvenueBookCentre");

    if (isRealRazorpay) {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setError("Failed to load Razorpay payment gateway SDK. Please check your internet connection.");
        setLoading(false);
        return;
      }

      // Amount in paise (INR subunits) for Razorpay gateway
      const inrAmount = orderTotal;
      const gatewayCurrency = "INR";
      const amountInSubunits = Math.round(inrAmount * 100);

      try {
        const options = {
          key: razorpayKeyId,
          amount: amountInSubunits,
          currency: gatewayCurrency,
          name: "Avenue Book Centre Book Store",
          description: "B2C Book Procurement Transaction Payment",
          image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&q=80",
          handler: function (response: any) {
            // Transaction approved by sandbox netbanking/wallet
            handlePaymentSuccess(response.razorpay_payment_id);
          },
          prefill: {
            name: name,
            email: email,
            contact: combinedPhone,
          },
          notes: {
            address: `${address}, ${city}, ${country}, ZIP: ${zip}`,
            conversionRate: "Direct INR billing",
          },
          theme: {
            color: "#0ea5e9", // Sky blue brand color matching Lucide accents
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err: any) {
        setError(err.message || "Failed to initialize payment gateway modal.");
        setLoading(false);
      }
    } else {
      // Offline fallback: Trigger Avenue Pay local mock overlay
      setIsGatewayOpen(true);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId?: string) => {
    setError("");
    loadingOrder(true);

    const combinedPhone = phoneLocal.trim() ? `${phoneCode} ${phoneLocal.trim()}` : "";
    const isPickup = shippingMethod === "PICKUP";
    const fullShippingAddress = isPickup 
      ? `STORE PICKUP - Collection at Avenue Book Centre (Google Maps: https://share.google/yFmSXGCZUwICm9x3o), Phone: ${combinedPhone}`
      : `${address}, ${city}, ${country}, ZIP: ${zip}, Phone: ${combinedPhone}`;

    const orderData = {
      customerName: name,
      customerEmail: email,
      shippingAddress: `${fullShippingAddress}${paymentId ? ` (Paid via Razorpay, ID: ${paymentId})` : ""}`,
      userId: session?.user?.id || null,
      couponCode: couponCode || null,
      shippingMethod: shippingMethod,
      zipCode: zip,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: item.price
      }))
    };

    const res = await createOrder(orderData);

    if (res.error) {
      setError(res.error);
      setIsGatewayOpen(false);
      loadingOrder(false);
    } else {
      clearCart();
      setIsGatewayOpen(false);
      window.location.href = `/order-success?orderId=${res.orderId}`;
    }
  };

  const isFreeShipping = shippingCost === 0;

  // Inline loading helper mapping
  const loadingOrder = (state: boolean) => {
    setLoading(state);
  };

  return (
    <>
      <form onSubmit={handleCheckoutSubmit} className="checkout-grid">
        {/* Left side: Checkout Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          
          {error && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid var(--danger)",
              color: "var(--danger)",
              padding: "1rem 1.5rem",
              borderRadius: "var(--radius-lg)",
              fontSize: "0.95rem",
              fontWeight: 500
            }}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Shipping Details */}
          <fieldset className="card" style={{ border: "none", padding: "2rem" }}>
            <legend style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", color: "var(--text-primary)", float: "left", width: "100%", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--brand-glow)", color: "var(--brand-primary)", width: "28px", height: "28px", borderRadius: "50%", fontSize: "0.85rem", fontWeight: 800 }}>1</span>
                Shipping Address
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {locationFeedback === "success" && (
                  <span style={{ fontSize: "0.75rem", color: "var(--success)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(16, 185, 129, 0.08)", padding: "0.25rem 0.6rem", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                    ✓ Geocoded
                  </span>
                )}
                {locationFeedback === "fallback" && (
                  <span style={{ fontSize: "0.75rem", color: "var(--brand-secondary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "0.25rem", background: "rgba(2, 132, 199, 0.08)", padding: "0.25rem 0.6rem", borderRadius: "12px", border: "1px solid rgba(2, 132, 199, 0.15)" }}>
                    ℹ Default Used
                  </span>
                )}
                <button 
                  type="button" 
                  onClick={handleDetectLocation}
                  disabled={detecting}
                  className="btn btn-primary" 
                  style={{ 
                    padding: "0.35rem 0.85rem", 
                    fontSize: "0.75rem", 
                    borderRadius: "15px", 
                    background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)", 
                    border: "none", 
                    display: "inline-flex", 
                    alignItems: "center", 
                    gap: "0.35rem", 
                    color: "#ffffff", 
                    fontWeight: 700, 
                    boxShadow: "0 4px 10px rgba(14, 165, 233, 0.25)",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 6px 14px rgba(14, 165, 233, 0.35)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 10px rgba(14, 165, 233, 0.25)";
                  }}
                >
                  {detecting ? (
                    <>
                      <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <MapPin size={12} />
                      <span>Detect My Location</span>
                    </>
                  )}
                </button>
              </div>
            </legend>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
              <div className="checkout-form-grid-3">
                <div>
                  <label className="label-base">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    className="input-base"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    className="input-base"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label-base">Phone Number *</label>
                  <div style={{ display: "flex", gap: "0.35rem" }}>
                    <select 
                      value={phoneCode}
                      onChange={(e) => setPhoneCode(e.target.value)}
                      className="input-base" 
                      style={{ width: "80px", padding: "0.5rem 0.25rem", fontSize: "0.85rem", flexShrink: 0, background: "#ffffff", cursor: "pointer" }}
                    >
                      <option value="+91">+91</option>
                      <option value="+1">+1</option>
                      <option value="+44">+44</option>
                      <option value="+971">+971</option>
                      <option value="+49">+49</option>
                      <option value="+33">+33</option>
                      <option value="+61">+61</option>
                      <option value="+81">+81</option>
                      <option value="+65">+65</option>
                      <option value="+966">+966</option>
                    </select>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9999999999"
                      className="input-base"
                      value={phoneLocal}
                      onChange={(e) => setPhoneLocal(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      style={{ flexGrow: 1 }}
                    />
                  </div>
                </div>
              </div>


              {shippingMethod !== "PICKUP" && (
                <>
                  <div style={{ marginTop: "1rem" }}>
                    <label className="label-base">Street Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="123 Corporate Blvd, Suite 400"
                      className="input-base"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="checkout-form-grid-3">
                    <div>
                      <label className="label-base">City *</label>
                      <input
                        type="text"
                        required
                        placeholder="Mumbai"
                        className="input-base"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label-base">Country *</label>
                      <input
                        type="text"
                        required
                        placeholder="India"
                        className="input-base"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="label-base">ZIP / Postal Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="400001"
                        className="input-base"
                        value={zip}
                        onChange={(e) => setZip(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <div style={{ marginTop: "1.5rem" }}>
                <label className="label-base" style={{ marginBottom: "0.75rem", display: "block" }}>Collection / Shipping Method *</label>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "1rem",
                  marginBottom: "1.25rem"
                }}>
                  {/* Option 2: Indian Postal Service */}
                  <div
                    onClick={() => setShippingMethod("IPS")}
                    style={{
                      border: shippingMethod === "IPS" ? "2px solid var(--brand-primary)" : "1px solid var(--border-color)",
                      background: shippingMethod === "IPS" ? "rgba(14, 165, 233, 0.03)" : "#ffffff",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>IPS (Speed Post)</strong>
                      <input type="radio" checked={shippingMethod === "IPS"} onChange={() => setShippingMethod("IPS")} style={{ accentColor: "var(--brand-primary)" }} />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Indian Postal Service Speed Post</span>
                    <strong style={{ fontSize: "0.95rem", color: "var(--brand-primary)", marginTop: "0.5rem" }}>
                      {shippingCostIps === 0 ? "FREE" : `${currencySymbol}${shippingCostIps.toFixed(2)}`}
                    </strong>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Est. 4-7 business days</span>
                  </div>

                  {/* Option 2.5: Logistics Aggregator APIs */}
                  {(shippingRules?.aggregator?.enabled === true || shippingRules?.aggregator?.enabled === "true") && (
                    <div
                      onClick={() => setShippingMethod("AGGREGATOR")}
                      style={{
                        border: shippingMethod === "AGGREGATOR" ? "2px solid var(--brand-primary)" : "1px solid var(--border-color)",
                        background: shippingMethod === "AGGREGATOR" ? "rgba(14, 165, 233, 0.03)" : "#ffffff",
                        padding: "1.25rem",
                        borderRadius: "var(--radius-md)",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.25rem",
                        transition: "all 0.2s"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Logistics Aggregator (Express)</strong>
                        <input type="radio" checked={shippingMethod === "AGGREGATOR"} onChange={() => setShippingMethod("AGGREGATOR")} style={{ accentColor: "var(--brand-primary)" }} />
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Express Courier (Shiprocket/ClickPost)</span>
                      <strong style={{ fontSize: "0.95rem", color: "var(--brand-primary)", marginTop: "0.5rem" }}>
                        {shippingCostAggregator === 0 ? "FREE" : `${currencySymbol}${shippingCostAggregator.toFixed(2)}`}
                      </strong>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Est. 2-4 business days</span>
                    </div>
                  )}

                  {/* Option 3: Pick Up From Store */}
                  <div 
                    onClick={() => setShippingMethod("PICKUP")}
                    style={{
                      border: shippingMethod === "PICKUP" ? "2px solid var(--brand-primary)" : "1px solid var(--border-color)",
                      background: shippingMethod === "PICKUP" ? "rgba(14, 165, 233, 0.03)" : "#ffffff",
                      padding: "1.25rem",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>Store Pickup</strong>
                      <input type="radio" checked={shippingMethod === "PICKUP"} onChange={() => setShippingMethod("PICKUP")} style={{ accentColor: "var(--brand-primary)" }} />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Collect at Avenue Book Centre</span>
                    <strong style={{ fontSize: "0.95rem", color: "var(--success)", marginTop: "0.5rem", fontWeight: 700 }}>
                      FREE
                    </strong>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Ready in 1-2 hours</span>
                  </div>
                </div>
              </div>

              {shippingMethod === "PICKUP" && (
                <div style={{
                  background: "rgba(14, 165, 233, 0.04)",
                  border: "1.5px dashed var(--brand-primary)",
                  padding: "1.5rem",
                  borderRadius: "var(--radius-lg)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginTop: "0.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <MapPin size={20} color="var(--brand-primary)" />
                    <h4 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary)" }}>Store Pickup Collection</h4>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    Your books will be prepared at our retail counter. Visit our store to collect your package:
                  </p>
                  <div style={{ background: "#ffffff", padding: "1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", fontSize: "0.85rem" }}>
                    <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "0.25rem" }}>Avenue Book Centre</strong>
                    <p style={{ margin: "0 0 0.5rem 0", color: "var(--text-secondary)" }}>
                      Premium Novels, Curriculum Textbooks & Curated Stationery Supplies
                    </p>
                    <a 
                      href="https://share.google/yFmSXGCZUwICm9x3o" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      style={{ 
                        color: "var(--brand-primary)", 
                        fontWeight: 700, 
                        display: "inline-flex", 
                        alignItems: "center", 
                        gap: "0.25rem",
                        textDecoration: "underline"
                      }}
                    >
                      📍 View Location on Google Maps
                    </a>
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                    * Please bring your confirmation email or order invoice ID for verification at pickup.
                  </span>
                </div>
              )}
            </div>
          </fieldset>

          {/* 2. Secure Payment (Simulated) */}
          <fieldset className="card" style={{ border: "none", padding: "2rem" }}>
            <legend style={{ fontSize: "1.3rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-primary)", float: "left", width: "100%", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--brand-glow)", color: "var(--brand-primary)", width: "28px", height: "28px", borderRadius: "50%", fontSize: "0.85rem", fontWeight: 800 }}>2</span>
              Secure Payment Method
            </legend>

            <div style={{ background: "var(--bg-tertiary)", padding: "1rem", borderRadius: "var(--radius-md)", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", border: "1px dashed var(--border-color)" }}>
              <Lock size={16} color="var(--brand-primary)" />
              <span>This is a simulated secure check-out. Do not enter real credit card numbers.</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{ display: "flex", gap: "1rem", border: "1.5px solid var(--brand-primary)", background: "rgba(14, 165, 233, 0.03)", padding: "1.25rem", borderRadius: "var(--radius-md)", alignItems: "center" }}>
                <input type="radio" defaultChecked style={{ width: "20px", height: "20px", cursor: "pointer" }} />
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexGrow: 1 }}>
                  <CreditCard size={24} color="var(--brand-secondary)" />
                  <div>
                    <strong style={{ display: "block", fontSize: "0.95rem" }}>Credit / Debit Card</strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Visa, Mastercard, RuPay</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: "0.5rem 0.25rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  <div>
                    <label className="label-base">Card Number *</label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        required
                        placeholder="4111 2222 3333 4444"
                        className="input-base"
                        maxLength={19}
                        style={{ paddingLeft: "3rem" }}
                      />
                      <CreditCard size={18} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                    </div>
                  </div>

                  <div className="checkout-form-grid-2">
                    <div>
                      <label className="label-base">Expiration Date *</label>
                      <input type="text" required placeholder="MM/YY" className="input-base" maxLength={5} />
                    </div>
                    <div>
                      <label className="label-base">Security Code (CVV) *</label>
                      <input type="password" required placeholder="•••" className="input-base" maxLength={4} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </fieldset>

        </div>

        {/* Right side: Summary & Submit - takes 1/3 of space */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="checkout-summary-col">
          <div className="card" style={{ background: "#ffffff", border: "1px solid var(--border-color)", padding: "2rem" }}>
            
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: "100%",
                padding: "1.25rem",
                fontSize: "1.15rem",
                fontWeight: 800,
                display: "flex",
                justifyContent: "center",
                gap: "0.5rem",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", // Golden orange checkout button
                border: "none",
                color: "#ffffff",
                boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
                opacity: loading ? 0.7 : 1,
                marginBottom: "1.5rem"
              }}
            >
              {loading ? "Placing Order..." : "Proceed to Payment"}
            </button>

            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textAlign: "center", marginBottom: "2rem" }}>
              Secure check-out: your details are encrypted and verified immediately.
            </div>

            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              Order Items ({cartCount})
            </h3>

            {/* List of checkout items */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "240px", overflowY: "auto", paddingRight: "0.5rem", marginBottom: "2rem" }}>
              {cart.map((item) => (
                <div key={item.productId} style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                  <div style={{ position: "relative", width: "40px", height: "50px", background: "var(--bg-tertiary)", borderRadius: "4px", overflow: "hidden", flexShrink: 0 }}>
                    <img
                      src={item.imageUrl || "/placeholder.jpg"}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", gap: "0.5rem" }}>
                      <span>Qty: {item.quantity}</span>
                      <span>•</span>
                      <span>{(item.weight * item.quantity).toFixed(2)} kg</span>
                    </div>
                  </div>
                  {/* Delete Item Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.productId)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--danger)",
                      cursor: "pointer",
                      padding: "0.4rem",
                      borderRadius: "4px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                    title="Remove product from cart"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.5rem" }}>
              Payment Summary
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Items Subtotal:</span>
                <span>{currencySymbol}{cartSubtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--success)", fontWeight: 500 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Tag size={12} /> Coupon Savings ({couponCode}):</span>
                  <span>-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                  <Scale size={12} /> {shippingMethod === "PICKUP" ? "Store Collection:" : `Shipping (${cartWeight.toFixed(2)} kg):`}
                </span>
                <span style={{ color: isFreeShipping || shippingMethod === "PICKUP" ? "var(--success)" : "var(--text-secondary)", fontWeight: isFreeShipping || shippingMethod === "PICKUP" ? 600 : 400 }}>
                  {isFreeShipping || shippingMethod === "PICKUP" ? "FREE" : `${currencySymbol}${shippingCost.toFixed(2)}`}
                </span>
              </div>

               <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)" }}>
                <span>Estimated Tax ({globalTaxRate}%):</span>
                <span>{currencySymbol}{taxCost.toFixed(2)}</span>
              </div>

              <div style={{ height: "1px", background: "var(--border-color)", margin: "0.25rem 0" }}></div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)" }}>
                <span>Order Total:</span>
                <span style={{ color: "var(--brand-dark)" }}>{currencySymbol}{orderTotal.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "2rem", color: "var(--text-muted)", fontSize: "0.8rem", justifyContent: "center" }}>
              <ShieldCheck size={16} color="var(--success)" /> Safe SSL Shopping Channel
            </div>
          </div>

          <Link href="/cart" className="btn btn-outline" style={{ padding: "0.85rem", width: "100%", display: "flex", justifyContent: "center", gap: "0.5rem" }}>
            <ArrowLeft size={16} /> Edit Shopping Cart
          </Link>
        </div>
      </form>

      {/* Gateway Authorization Overlay */}
      <PaymentGateway
        isOpen={isGatewayOpen}
        amount={orderTotal}
        currencySymbol={currencySymbol}
        phone={phoneLocal.trim() ? `${phoneCode} ${phoneLocal.trim()}` : ""}
        onSuccess={handlePaymentSuccess}
        onCancel={() => setIsGatewayOpen(false)}
      />
    </>
  );
}
