import { auth } from "@/auth";
import CheckoutForm from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const session = await auth();

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "3rem 0 6rem 0" }}>
      <div className="container">
        <h1 style={{ fontSize: "2.5rem", marginBottom: "2rem", letterSpacing: "-0.02em" }}>Checkout</h1>
        <CheckoutForm session={session} />
      </div>
    </div>
  );
}
