import Link from "next/link";
import { CheckCircle, Truck, Package, Calendar, ArrowRight, ClipboardList } from "lucide-react";
import prisma from "@/lib/prisma";
import { getCurrencySettings } from "@/app/actions";

export const metadata = {
  title: "Order Success | Avenue Book Centre",
};

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  const currency = await getCurrencySettings();
  const currencySymbol = currency.symbol;

  if (!orderId) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 2rem" }}>
        <div style={{ textAlign: "center", background: "#ffffff", padding: "3rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Invalid Order Link</h1>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>We could not locate an active checkout session for this request.</p>
          <Link href="/products" className="btn btn-primary">Go to Catalog</Link>
        </div>
      </div>
    );
  }

  // Fetch the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 2rem" }}>
        <div style={{ textAlign: "center", background: "#ffffff", padding: "3rem", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)", maxWidth: "500px" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Order Not Found</h1>
          <p className="text-muted" style={{ marginBottom: "1.5rem" }}>Order ID "{orderId}" does not exist in our database records.</p>
          <Link href="/products" className="btn btn-primary">Go to Catalog</Link>
        </div>
      </div>
    );
  }

  // Estimate delivery: 4 days from order creation
  const deliveryDate = new Date(order.createdAt);
  deliveryDate.setDate(deliveryDate.getDate() + 4);
  const formattedDeliveryDate = deliveryDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "4rem 1.5rem" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        
        {/* Celebration Header */}
        <div className="card text-center" style={{ padding: "3.5rem 2rem", marginBottom: "2rem", borderTop: "6px solid var(--success)" }}>
          <div style={{ display: "inline-flex", color: "var(--success)", marginBottom: "1.5rem" }}>
            <CheckCircle size={72} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", letterSpacing: "-0.02em" }}>Order Confirmed!</h1>
          <p style={{ fontSize: "1.1rem", color: "var(--success)", fontWeight: 600, marginBottom: "1.5rem" }}>
            ✓ Your order has been confirmed successfully!
          </p>
          <div style={{ display: "inline-block", background: "var(--bg-tertiary)", padding: "0.5rem 1.25rem", borderRadius: "var(--radius-sm)", fontFamily: "monospace", fontSize: "0.9rem", color: "var(--text-secondary)", fontWeight: 600 }}>
            Order ID: {order.id}
          </div>
        </div>

        {/* Order Details Details Grid */}
        <div className="grid-responsive-2" style={{ gap: "1.5rem", marginBottom: "2rem" }}>
          
          {/* Estimated Shipping */}
          <div className="card" style={{ padding: "1.5rem 2rem", display: "flex", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "var(--brand-glow)", color: "var(--brand-primary)", flexShrink: 0 }}>
              <Truck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Delivery Estimate</h2>
              <p style={{ fontSize: "1rem", color: "var(--brand-dark)", fontWeight: 600, marginBottom: "0.25rem" }}>{formattedDeliveryDate}</p>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Calendar size={12} /> Standard B2C Express Delivery
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="card" style={{ padding: "1.5rem 2rem", display: "flex", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "48px", height: "48px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", flexShrink: 0 }}>
              <Package size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.25rem" }}>Shipping To</h2>
              <p style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem" }}>{order.customerName}</p>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4", display: "block" }}>
                {order.shippingAddress}
              </span>
            </div>
          </div>

        </div>

        {/* Order Receipt */}
        <div className="card" style={{ padding: "2rem", marginBottom: "3rem" }}>
          <h2 style={{ fontSize: "1.25rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", marginBottom: "1.5rem" }}>Receipt Details</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {order.items.map((item) => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", borderBottom: "1px dashed var(--border-color)", paddingBottom: "0.75rem" }}>
                <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} style={{ width: "36px", height: "44px", objectFit: "cover", borderRadius: "4px" }} />
                  ) : (
                    <div style={{ width: "36px", height: "44px", background: "var(--bg-tertiary)", borderRadius: "4px" }}></div>
                  )}
                  <div>
                    <span style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)" }}>{item.product.name}</span>
                    <span style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)" }}>Qty: {item.quantity}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                  {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700, fontSize: "1.25rem", paddingTop: "0.5rem" }}>
              <span>Total Paid:</span>
              <span style={{ color: "var(--brand-dark)" }}>{currencySymbol}{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/products" className="btn btn-primary" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
            Continue Shopping <ArrowRight size={18} />
          </Link>
          <Link href="/orders" className="btn btn-outline" style={{ padding: "1rem 2rem", fontSize: "1.1rem" }}>
            <ClipboardList size={18} /> View Your Orders
          </Link>
        </div>

      </div>
    </div>
  );
}
