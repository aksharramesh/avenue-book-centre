import Link from "next/link";
import { ClipboardList, AlertCircle, ShoppingBag, ChevronRight, PackageCheck, Clock } from "lucide-react";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { getCurrencySettings } from "@/app/actions";

export const metadata = {
  title: "Your Orders | Avenue Book Centre",
};

export default async function OrdersHistoryPage() {
  const session = await auth();
  const currency = await getCurrencySettings();
  const currencySymbol = currency.symbol;

  // If not logged in
  if (!session?.user) {
    return (
      <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", display: "flex", alignItems: "center", justifyContent: "center", padding: "4rem 1.5rem" }}>
        <div className="card text-center" style={{ maxWidth: "500px", padding: "3rem 2rem" }}>
          <AlertCircle size={48} color="var(--brand-primary)" style={{ margin: "0 auto 1rem auto" }} />
          <h1 style={{ fontSize: "1.75rem", marginBottom: "1rem" }}>Sign in to view orders</h1>
          <p className="text-muted" style={{ marginBottom: "2rem" }}>
            Please log in to your customer account to view your past purchases, shipment statuses, and express tracking history.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link href="/login" className="btn btn-primary">Sign In Now</Link>
            <Link href="/products" className="btn btn-outline">Browse Products</Link>
          </div>
        </div>
      </div>
    );
  }

  // Fetch logged-in user orders
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "3rem 0 6rem 0" }}>
      <div className="container" style={{ maxWidth: "900px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <ClipboardList size={32} color="var(--brand-primary)" />
          <h1 style={{ fontSize: "2.5rem", margin: 0, letterSpacing: "-0.02em" }}>Your Orders</h1>
        </div>

        {orders.length === 0 ? (
          <div className="card text-center" style={{ padding: "4rem 2rem" }}>
            <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: "0 auto 1.25rem auto" }} />
            <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>No orders placed yet</h2>
            <p className="text-muted" style={{ marginBottom: "2rem" }}>
              You haven't bought any premium school books or office stationeries yet.
            </p>
            <Link href="/products" className="btn btn-primary">
              Start Shopping <ChevronRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {orders.map((order) => (
              <div key={order.id} className="card" style={{ padding: 0, overflow: "hidden" }}>
                
                {/* Order Card Header */}
                <div style={{
                  background: "var(--bg-secondary)",
                  borderBottom: "1px solid var(--border-color)",
                  padding: "1.25rem 1.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1.5rem",
                  fontSize: "0.85rem"
                }}>
                  <div style={{ display: "flex", gap: "2.5rem", flexWrap: "wrap" }}>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, fontSize: "0.75rem", marginBottom: "0.25rem" }}>Order Placed</span>
                      <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                        {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </strong>
                    </div>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, fontSize: "0.75rem", marginBottom: "0.25rem" }}>Total Paid</span>
                      <strong style={{ color: "var(--text-primary)", fontWeight: 700 }}>{currencySymbol}{order.totalAmount.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span style={{ display: "block", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, fontSize: "0.75rem", marginBottom: "0.25rem" }}>Ship To</span>
                      <strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>{order.customerName}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "block", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, fontSize: "0.75rem", marginBottom: "0.25rem" }}>Order ID</span>
                    <strong style={{ fontFamily: "monospace", color: "var(--text-secondary)" }}>{order.id}</strong>
                  </div>
                </div>

                {/* Order Items List */}
                <div style={{ padding: "1.75rem" }}>
                  
                  {/* Status Indicator */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
                    {order.status === "PROCESSING" ? (
                      <>
                        <Clock size={18} color="var(--brand-secondary)" />
                        <span style={{ fontWeight: 700, color: "var(--brand-secondary)", fontSize: "0.95rem" }}>Processing (Express B2C)</span>
                      </>
                    ) : (
                      <>
                        <PackageCheck size={18} color="var(--success)" />
                        <span style={{ fontWeight: 700, color: "var(--success)", fontSize: "0.95rem" }}>{order.status}</span>
                      </>
                    )}
                  </div>

                  {/* List */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {order.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                          <Link href={`/products/${item.productId}`}>
                            {item.product.imageUrl ? (
                              <img src={item.product.imageUrl} alt={item.product.name} style={{ width: "48px", height: "58px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                            ) : (
                              <div style={{ width: "48px", height: "58px", background: "var(--bg-tertiary)", borderRadius: "4px", border: "1px solid var(--border-color)" }}></div>
                            )}
                          </Link>
                          <div>
                            <h3 style={{ fontSize: "1rem", margin: "0 0 0.25rem 0" }}>
                              <Link href={`/products/${item.productId}`} className="nav-link" style={{ fontWeight: 600 }}>{item.product.name}</Link>
                            </h3>
                            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Quantity: {item.quantity}</span>
                          </div>
                        </div>

                        <div style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
