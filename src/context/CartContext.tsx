"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { validateCoupon } from "@/app/actions";

export function resolveShippingZone(zip: string): "LOCAL" | "STATE" | "NATIONAL" {
  const cleanZip = zip.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanZip)) return "NATIONAL";
  if (cleanZip.startsWith("400")) return "LOCAL";
  const prefix2 = cleanZip.substring(0, 2);
  const prefixNum = parseInt(prefix2, 10);
  if (prefixNum >= 40 && prefixNum <= 44) return "STATE";
  return "NATIONAL";
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string | null;
  sku: string;
  weight: number; // Item weight in kg
  quantity: number;
  categoryId?: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: { id: string; name: string; price: number; imageUrl: string | null; sku: string; weight: number; categoryId?: string }, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  cartWeight: number; // Total cart weight in kg
  couponCode: string;
  discountAmount: number;
  shippingCost: number;
  shippingCostFlat: number;
  shippingCostIps: number;
  shippingCostAggregator: number;
  shippingMethod: "IPS" | "PICKUP" | "AGGREGATOR";
  setShippingMethod: (method: "IPS" | "PICKUP" | "AGGREGATOR") => void;
  zipCode: string;
  setZipCode: (zip: string) => void;
  taxCost: number;
  orderTotal: number;
  applyCoupon: (code: string) => Promise<{ success: boolean; message: string }>;
  removeCoupon: () => void;
  isLoaded: boolean;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  globalTaxRate: number;
  shippingRules: any;
  showBuyButtons: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState<{ type: string; value: number; minWeight: number } | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Dynamic client-side tax rules state
  const [taxRules, setTaxRules] = useState<any[]>([]);
  const [globalTaxRate, setGlobalTaxRate] = useState<number>(8.0);

  // Dynamic client-side shipping rules and active method states
  const [shippingMethod, setShippingMethod] = useState<"IPS" | "PICKUP" | "AGGREGATOR">("IPS");
  const [zipCode, setZipCode] = useState("");
  const [shippingRules, setShippingRules] = useState<any>(null);
  const [showBuyButtons, setShowBuyButtons] = useState<boolean>(true);

  // Load cart and coupon from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("ink_paper_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
      
      const savedCouponCode = localStorage.getItem("ink_paper_coupon_code");
      const savedCouponDiscount = localStorage.getItem("ink_paper_coupon_discount");
      if (savedCouponCode && savedCouponDiscount) {
        setCouponCode(savedCouponCode);
        setCouponDiscount(JSON.parse(savedCouponDiscount));
      }
    } catch (e) {
      console.error("Failed to load e-commerce state:", e);
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem("ink_paper_cart", JSON.stringify(cart));
      } catch (e) {
        console.error("Failed to save cart:", e);
      }
    }
  }, [cart, isLoaded]);

  // Save coupon to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        if (couponCode && couponDiscount) {
          localStorage.setItem("ink_paper_coupon_code", couponCode);
          localStorage.setItem("ink_paper_coupon_discount", JSON.stringify(couponDiscount));
        } else {
          localStorage.removeItem("ink_paper_coupon_code");
          localStorage.removeItem("ink_paper_coupon_discount");
        }
      } catch (e) {
        console.error("Failed to save coupon:", e);
      }
    }
  }, [couponCode, couponDiscount, isLoaded]);

  // Load active tax overrides dynamically from DB
  useEffect(() => {
    if (isLoaded) {
      import("@/app/actions").then(({ getTaxRules }) => {
        getTaxRules().then(res => {
          if (res) {
            setGlobalTaxRate(res.globalRate);
            setTaxRules(res.rules);
          }
        });
      });
    }
  }, [isLoaded, cart]);

  // Load active shipping overrides dynamically from DB
  useEffect(() => {
    if (isLoaded) {
      import("@/app/actions").then(({ getShippingSettings }) => {
        getShippingSettings().then(res => {
          if (res) {
            setShippingRules(res);
          }
        });
      });
    }
  }, [isLoaded]);

  // Load showBuyButtons config dynamically from DB
  useEffect(() => {
    if (isLoaded) {
      import("@/app/actions").then(({ getCMSContent }) => {
        getCMSContent("config_show_buy_buttons").then(res => {
          setShowBuyButtons(res !== "false");
        });
      });
    }
  }, [isLoaded, cart]);

  const addToCart = (
    product: { id: string; name: string; price: number; imageUrl: string | null; sku: string; weight: number; categoryId?: string },
    quantity = 1
  ) => {
    setIsDrawerOpen(true);
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          sku: product.sku,
          weight: product.weight || 0.5,
          quantity,
          categoryId: product.categoryId
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
    removeCoupon();
  };

  const applyCoupon = async (code: string) => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode) {
      return { success: false, message: "Please enter a valid coupon code." };
    }

    const res = await validateCoupon(trimmedCode);

    if (res.error) {
      return { success: false, message: res.error };
    }

    if (res.discount) {
      const discountData = res.discount;
      
      // Validate minimum weight condition if coupon needs it
      const currentWeight = cart.reduce((total, item) => total + item.weight * item.quantity, 0);
      if (discountData.minWeight > 0 && currentWeight < discountData.minWeight) {
        return {
          success: false,
          message: `Coupon "${trimmedCode}" requires a minimum total order weight of ${discountData.minWeight} kg. Your cart is only ${currentWeight.toFixed(2)} kg.`
        };
      }

      setCouponCode(trimmedCode);
      setCouponDiscount({
        type: discountData.type,
        value: discountData.value,
        minWeight: discountData.minWeight
      });

      return { success: true, message: `Coupon "${trimmedCode}" applied successfully!` };
    }

    return { success: false, message: "Invalid promo code." };
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscount(null);
  };

  // Aggregators & B2C E-Commerce logic calculations
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartSubtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
  const cartWeight = cart.reduce((total, item) => total + item.weight * item.quantity, 0);

  // 1. Discount Amount
  let discountAmount = 0;
  if (couponDiscount) {
    if (couponDiscount.type === "PERCENT") {
      discountAmount = cartSubtotal * (couponDiscount.value / 100);
    } else if (couponDiscount.type === "FLAT") {
      discountAmount = Math.min(couponDiscount.value, cartSubtotal);
    }
  }

  const subtotalAfterDiscount = cartSubtotal - discountAmount;

  // 2. Weight-Based Shipping Fees (Flat & Indian Postal Service)
  let shippingCostFlat = 0;
  let shippingCostIps = 0;
  let shippingCostAggregator = 0;

  if (cartCount > 0) {
    // FLAT calculation (retained for fallback telemetry/compat, but functionally bypassed)
    const flatBaseCost = shippingRules?.flat?.baseCost ? parseFloat(shippingRules.flat.baseCost) : 4.99;
    const flatBaseWeight = shippingRules?.flat?.baseWeight ? parseFloat(shippingRules.flat.baseWeight) : 1.0;
    const flatAdditionalCost = shippingRules?.flat?.additionalCost ? parseFloat(shippingRules.flat.additionalCost) : 1.99;
    const flatFreeThreshold = shippingRules?.flat?.freeThreshold ? parseFloat(shippingRules.flat.freeThreshold) : 100.00;

    if (subtotalAfterDiscount >= flatFreeThreshold) {
      shippingCostFlat = 0.00;
    } else if (cartWeight <= flatBaseWeight) {
      shippingCostFlat = flatBaseCost;
    } else {
      const additionalWeight = Math.ceil(cartWeight - flatBaseWeight);
      shippingCostFlat = flatBaseCost + additionalWeight * flatAdditionalCost;
    }

    // IPS calculation (Zone-based Option 3)
    const ipsEnabled = shippingRules?.ips?.enabled !== undefined ? shippingRules.ips.enabled : true;
    const ipsFreeThreshold = shippingRules?.ips?.freeThreshold ? parseFloat(shippingRules.ips.freeThreshold) : 150.00;
    
    if (!ipsEnabled) {
      shippingCostIps = 999999.00; // Disable if not enabled
    } else if (subtotalAfterDiscount >= ipsFreeThreshold) {
      shippingCostIps = 0.00;
    } else {
      // Resolve zone based on current client zipCode state
      const zone = resolveShippingZone(zipCode);
      let ratesStr = shippingRules?.ips?.ratesNational || "0.5:40.00,1:70.00,2:120.00";
      if (zone === "LOCAL") {
        ratesStr = shippingRules?.ips?.ratesLocal || "0.5:20.00,1:30.00,2:50.00";
      } else if (zone === "STATE") {
        ratesStr = shippingRules?.ips?.ratesState || "0.5:30.00,1:50.00,2:80.00";
      }

      // Parse OpenCart-style rates
      const tiers = ratesStr.split(",").map((tier: string) => {
        const parts = tier.split(":");
        return {
          weight: parseFloat(parts[0]),
          cost: parseFloat(parts[1])
        };
      }).filter((t: { weight: number; cost: number }) => !isNaN(t.weight) && !isNaN(t.cost));

      tiers.sort((a: { weight: number; cost: number }, b: { weight: number; cost: number }) => a.weight - b.weight);

      let found = false;
      for (const tier of tiers) {
        if (tier.weight >= cartWeight) {
          shippingCostIps = tier.cost;
          found = true;
          break;
        }
      }

      if (!found) {
        if (tiers.length > 0) {
          shippingCostIps = tiers[tiers.length - 1].cost;
        } else {
          shippingCostIps = 50.00;
        }
      }
    }

    // Aggregator calculation
    const aggEnabled = shippingRules?.aggregator?.enabled !== undefined ? shippingRules.aggregator.enabled : false;
    const aggFreeThreshold = shippingRules?.aggregator?.freeThreshold ? parseFloat(shippingRules.aggregator.freeThreshold) : 200.00;
    const aggBaseCost = shippingRules?.aggregator?.baseCost ? parseFloat(shippingRules.aggregator.baseCost) : 60.00;
    const aggPerKgCost = shippingRules?.aggregator?.perKgCost ? parseFloat(shippingRules.aggregator.perKgCost) : 20.00;

    if (!aggEnabled) {
      shippingCostAggregator = 999999.00; // Disable if not enabled
    } else if (subtotalAfterDiscount >= aggFreeThreshold) {
      shippingCostAggregator = 0.00;
    } else {
      const additionalWeight = Math.max(0, cartWeight - 1.0);
      shippingCostAggregator = aggBaseCost + (additionalWeight * aggPerKgCost);
    }
  }

  // Determine active shipping cost
  let shippingCost = 0.00;
  if (shippingMethod === "IPS") {
    shippingCost = shippingCostIps;
  } else if (shippingMethod === "AGGREGATOR") {
    shippingCost = shippingCostAggregator;
  } else {
    shippingCost = 0.00; // PICKUP
  }

  // FREEHEAVY Coupon gives free delivery if cart weight >= 3.0 kg
  if (couponCode === "FREEHEAVY" && cartWeight >= 3.0) {
    shippingCost = 0.00;
    shippingCostFlat = 0.00;
    shippingCostIps = 0.00;
    shippingCostAggregator = 0.00;
  }

  // 3. Tax Cost (item-by-item line-itemized category & product calculation)
  const discountRatio = cartSubtotal > 0 ? (cartSubtotal - discountAmount) / cartSubtotal : 0;
  let calculatedTax = 0;

  cart.forEach(item => {
    let activeRule = null;
    
    // Product-specific overrides
    activeRule = taxRules.find(r => r.targetType === "PRODUCT" && r.targetId === item.productId);
    
    // Category-specific overrides
    if (!activeRule && item.categoryId) {
      activeRule = taxRules.find(r => r.targetType === "CATEGORY" && r.targetId === item.categoryId);
    }

    let baseTax = 0;
    if (activeRule) {
      if (activeRule.type === "PERCENT") {
        baseTax = item.price * item.quantity * (activeRule.value / 100);
      } else if (activeRule.type === "AMOUNT") {
        baseTax = activeRule.value * item.quantity;
      }
    } else {
      // Global percent-based fallback
      baseTax = item.price * item.quantity * (globalTaxRate / 100);
    }

    calculatedTax += baseTax * discountRatio;
  });

  const taxCost = Math.max(0, calculatedTax);

  // 4. Grand Order Total
  const orderTotal = Math.max(0, subtotalAfterDiscount + shippingCost + taxCost);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        cartWeight,
        couponCode,
        discountAmount,
        shippingCost,
        shippingCostFlat,
        shippingCostIps,
        shippingCostAggregator,
        shippingMethod,
        setShippingMethod,
        zipCode,
        setZipCode,
        taxCost,
        orderTotal,
        applyCoupon,
        removeCoupon,
        isLoaded,
        isDrawerOpen,
        setIsDrawerOpen,
        globalTaxRate,
        shippingRules,
        showBuyButtons
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
