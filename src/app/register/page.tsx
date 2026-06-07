"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Feather, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { registerUser } from "../actions";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  useEffect(() => {
    document.title = "Create Account | Avenue Book Centre";
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your passcode entries.");
      setLoading(false);
      return;
    }

    const result = await registerUser(formData);
    
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', padding: '2rem 1rem' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', background: '#ffffff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-color)', boxShadow: '0 10px 25px rgba(0,0,0,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--brand-primary)', color: '#fff', borderRadius: '8px', padding: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '1rem' }}>
            <Feather size={32} strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', fontWeight: 800 }}>Create Account</h1>
          <p className="text-muted">Join Avenue Book Centre today</p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Full Name *</label>
            <input name="name" type="text" required className="input-base" placeholder="John Doe" style={{ width: '100%', padding: '0.75rem 1rem' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Email *</label>
            <input name="email" type="email" required className="input-base" placeholder="you@example.com" style={{ width: '100%', padding: '0.75rem 1rem' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Password *</label>
            <input name="password" type="password" required className="input-base" placeholder="••••••••" minLength={6} style={{ width: '100%', padding: '0.75rem 1rem' }} />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.875rem' }}>Confirm Password *</label>
            <input name="confirmPassword" type="password" required className="input-base" placeholder="••••••••" style={{ width: '100%', padding: '0.75rem 1rem' }} />
          </div>

          {/* Collapsible Shipping & Contact Section */}
          <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setShowAdditional(!showAdditional)}
              style={{
                width: '100%',
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                transition: 'background 0.2s'
              }}
            >
              <span>Additional Shipping & Contact Details</span>
              {showAdditional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showAdditional && (
              <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: '#ffffff', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>Phone</label>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <select 
                        name="phoneCountryCode" 
                        className="input-base" 
                        style={{ width: '70px', padding: '0.5rem 0.25rem', fontSize: '0.8rem', flexShrink: 0, background: 'var(--bg-primary)' }}
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
                        name="phoneLocal" 
                        type="tel" 
                        maxLength={10}
                        pattern="[0-9]{10}"
                        title="Phone number must be exactly 10 digits"
                        className="input-base" 
                        placeholder="9999999999" 
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/\D/g, "").slice(0, 10);
                        }}
                        style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem', flexGrow: 1 }} 
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>Fax</label>
                    <input name="fax" type="tel" className="input-base" placeholder="Fax number" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>Street Address</label>
                  <input name="address" type="text" className="input-base" placeholder="123 Shopping Lane" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>City</label>
                    <input name="city" type="text" className="input-base" placeholder="Mumbai" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>State</label>
                    <input name="state" type="text" className="input-base" placeholder="Maharashtra" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>ZIP / Postal Code</label>
                    <input name="postalCode" type="text" className="input-base" placeholder="400001" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.8rem' }}>Country</label>
                    <input name="country" type="text" className="input-base" defaultValue="India" placeholder="India" style={{ width: '100%', padding: '0.5rem 0.75rem', fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0.875rem', display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating...' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}
