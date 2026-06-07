"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { getCurrencySettings } from "@/app/actions";

export default function NavbarCart() {
  const { cartCount, orderTotal, isLoaded } = useCart();
  const [currencySymbol, setCurrencySymbol] = useState("₹");

  useEffect(() => {
    getCurrencySettings().then(res => {
      if (res && res.symbol) {
        setCurrencySymbol(res.symbol);
      }
    });
  }, []);

  return (
    <Link
      href="/cart"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.75rem",
        background: "#333333", // OpenCart dark cart widget color
        color: "#ffffff",
        padding: "0.6rem 1.25rem",
        borderRadius: "var(--radius-md)",
        fontWeight: 700,
        fontSize: "0.85rem",
        textDecoration: "none",
        minHeight: "44px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)",
        transition: "all 0.2s"
      }}
      className="opencart-cart-widget"
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.12)", padding: "4px", borderRadius: "50%" }}>
        <ShoppingCart size={16} color="#ffffff" />
      </div>
      <span>
        {isLoaded ? cartCount : 0} item(s) - {currencySymbol}{isLoaded ? orderTotal.toFixed(2) : "0.00"}
      </span>
    </Link>
  );
}
