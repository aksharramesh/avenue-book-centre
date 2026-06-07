"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Lock, CreditCard, Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface PaymentGatewayProps {
  isOpen: boolean;
  amount: number;
  currencySymbol?: string;
  phone?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PaymentGateway({ isOpen, amount, currencySymbol = "₹", phone = "", onSuccess, onCancel }: PaymentGatewayProps) {
  const [step, setStep] = useState(1); // 1: Connecting, 2: OTP, 3: Success
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto transition from Step 1 (Connecting) to Step 2 (OTP Input)
  useEffect(() => {
    if (isOpen && step === 1) {
      const timer = setTimeout(() => {
        setStep(2);
      }, 2500); // 2.5 seconds connecting delay
      return () => clearTimeout(timer);
    }
  }, [isOpen, step]);

  if (!isOpen) return null;

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");

    if (otp !== "1234") {
      setOtpError("Invalid OTP! Try entering the mock code '1234' to authorize.");
      return;
    }

    setLoading(true);
    // Simulate transaction capture
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      
      // Auto transition to success callback
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }, 2000);
  };

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.75)",
      backdropFilter: "blur(8px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "1rem"
    }}>
      <div style={{
        background: "#ffffff",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--border-color)",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)",
        maxWidth: "480px",
        width: "100%",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column"
      }}>
        {/* Gateway Header Banner */}
        <div style={{
          background: "var(--text-primary)",
          color: "#ffffff",
          padding: "1.25rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ display: "flex", background: "var(--brand-primary)", color: "#fff", borderRadius: "4px", padding: "4px" }}>
              <ShieldCheck size={18} strokeWidth={2.5} />
            </div>
            <strong style={{ fontSize: "1.1rem", letterSpacing: "-0.01em" }}>Avenue Pay Gateway</strong>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>
            <Lock size={12} /> SECURE 256-BIT
          </div>
        </div>

        {/* Amount bar */}
        <div style={{
          background: "var(--bg-tertiary)",
          padding: "0.75rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-color)",
          fontSize: "0.9rem"
        }}>
          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Merchant: <strong>Avenue Book Centre B2C</strong></span>
          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>Amount: <strong style={{ color: "var(--brand-dark)" }}>{currencySymbol}{amount.toFixed(2)}</strong></span>
        </div>

        {/* Step Content */}
        <div style={{ padding: "2.5rem 2rem", flexGrow: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          
          {/* STEP 1: CONNECTING */}
          {step === 1 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <Loader2 size={48} color="var(--brand-primary)" className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.5rem" }}>Contacting Banking Gateway...</h3>
                <p className="text-muted" style={{ fontSize: "0.875rem", maxWidth: "300px", margin: "0 auto", lineHeight: "1.5" }}>
                  Establishing secure encrypted connection with card authentication networks. Do not close or refresh this window.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 2 && (
            <div style={{ width: "100%" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--brand-glow)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
                <CreditCard size={28} />
              </div>
              
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>Authorize Transaction</h3>
              <p className="text-muted" style={{ fontSize: "0.85rem", lineHeight: "1.5", maxWidth: "340px", margin: "0 auto 1.5rem auto" }}>
                A secure SMS One-Time Passcode (OTP) has been dispatched to your registered phone {phone || "+1 (•••) •••-8822"}.
              </p>

              {otpError && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "0.8rem",
                  color: "var(--danger)",
                  background: "rgba(239, 68, 68, 0.05)",
                  padding: "0.5rem 0.75rem",
                  borderRadius: "6px",
                  border: "1px solid var(--danger)",
                  marginBottom: "1rem",
                  justifyContent: "center"
                }}>
                  <AlertCircle size={14} />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label-base" style={{ textAlign: "left" }}>Enter 4-Digit OTP Code *</label>
                  <input
                    type="password"
                    required
                    placeholder="••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="input-base"
                    style={{
                      textAlign: "center",
                      letterSpacing: "1rem",
                      fontSize: "1.5rem",
                      padding: "0.75rem 1rem",
                      fontWeight: 700
                    }}
                    disabled={loading}
                  />
                </div>

                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                  Demo Auth Bypass Code: <strong>1234</strong>
                </div>

                <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: "0.75rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "0.75rem", background: "var(--brand-primary)" }}
                  >
                    {loading ? (
                      <Loader2 size={16} className="animate-spin" style={{ animation: "spin 1s linear infinite" }} />
                    ) : (
                      "Verify & Pay"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: TRANSACTION SUCCESS */}
          {step === 3 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ color: "var(--success)" }}>
                <CheckCircle size={64} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--success)" }}>Payment Approved!</h3>
                <p className="text-muted" style={{ fontSize: "0.875rem", maxWidth: "280px", margin: "0 auto", lineHeight: "1.5" }}>
                  Transaction processed successfully. Creating secure e-commerce orders and printing billing invoice receipt...
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
