"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldAlert, Loader2, ArrowRight } from "lucide-react";
import { verifyAdminRole } from "@/app/actions";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Authorized Admin Login | Avenue Book Centre";
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // 1. Direct database pre-check of email permissions (avoids session cookie race conditions)
      const privilege = await verifyAdminRole(email);
      
      if (!privilege.isAuthorized) {
        setError("Access Denied: Your credentials hold no authorized administrative clearance.");
        setLoading(false);
        return;
      }

      // 2. NextAuth standard credentials verification
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid administrative credentials.");
        setLoading(false);
        return;
      }

      // 3. Success! Redirect to operations main console
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError("Security Gateway error. Failed to verify account privilege.");
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)", /* Modern sleek dark background */
      padding: "2rem" 
    }}>
      <div className="card animate-fade-in" style={{ 
        maxWidth: "440px", 
        width: "100%", 
        padding: "3rem 2.5rem",
        background: "rgba(30, 41, 59, 0.7)", /* Transparent glassmorphism slate */
        border: "1px solid rgba(255, 255, 255, 0.1)",
        backdropFilter: "blur(12px)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ background: "#ffffff", borderRadius: "12px", padding: "8px", boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}>
              <Image src="/logo.png" alt="Avenue Book Centre" width={52} height={52} style={{ objectFit: "contain", display: "block" }} />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#ffffff", lineHeight: 1.2 }}>Avenue Book Centre</div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8", marginTop: "2px" }}>Operations Portal</div>
            </div>
          </div>
          <span style={{ 
            fontSize: "0.75rem", 
            textTransform: "uppercase", 
            letterSpacing: "0.15em", 
            color: "#fbbf24", 
            fontWeight: 800,
            display: "block",
            marginTop: "0.5rem"
          }}>
            🔐 AUTHORIZED STAFF ONLY
          </span>
        </div>

        {/* Security Alert Messages */}
        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.15)", 
            border: "1px solid rgba(239, 68, 68, 0.4)", 
            color: "#fca5a5", 
            padding: "0.85rem 1rem", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "1.5rem", 
            fontSize: "0.825rem",
            lineHeight: 1.5,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.825rem", fontWeight: 600, color: "#cbd5e1" }}>Operational Email Address</label>
            <input 
              name="email" 
              type="email" 
              required 
              placeholder="admin@inkandpaper.com" 
              style={{ 
                width: "100%", 
                padding: "0.85rem 1.25rem", 
                borderRadius: "var(--radius-md)", 
                border: "1px solid rgba(255, 255, 255, 0.15)", 
                backgroundColor: "rgba(15, 23, 42, 0.8)", 
                color: "#ffffff",
                outline: "none",
                fontSize: "0.9rem"
              }} 
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <label style={{ fontSize: "0.825rem", fontWeight: 600, color: "#cbd5e1" }}>Security Passcode</label>
            <input 
              name="password" 
              type="password" 
              required 
              placeholder="••••••••" 
              style={{ 
                width: "100%", 
                padding: "0.85rem 1.25rem", 
                borderRadius: "var(--radius-md)", 
                border: "1px solid rgba(255, 255, 255, 0.15)", 
                backgroundColor: "rgba(15, 23, 42, 0.8)", 
                color: "#ffffff",
                outline: "none",
                fontSize: "0.9rem"
              }} 
            />
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn" 
            style={{ 
              padding: "1rem", 
              display: "flex", 
              justifyContent: "center", 
              gap: "0.5rem", 
              marginTop: "0.75rem", 
              background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", 
              boxShadow: "0 4px 14px rgba(245, 158, 11, 0.25)",
              color: "#ffffff",
              border: "none",
              fontWeight: 700,
              fontSize: "0.95rem",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "transform 0.2s"
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Authorizing...
              </>
            ) : (
              <>
                Secure Login <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Info Callout */}
        <div style={{ 
          textAlign: "center", 
          marginTop: "2.5rem", 
          fontSize: "0.75rem", 
          color: "#94a3b8",
          lineHeight: 1.5,
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "1.5rem"
        }}>
          🛡️ Secure SSL encryption channel is active. Unauthorized attempts will be logged automatically.
          <div style={{ marginTop: "1rem" }}>
            <Link href="/" style={{ color: "#fbbf24", fontWeight: 600 }}>Return to public store</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
