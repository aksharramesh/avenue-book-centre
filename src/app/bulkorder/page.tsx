"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  BookOpen, 
  Truck, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Mail, 
  Phone, 
  User, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";
import { createBulkOrder } from "@/app/actions";

export default function BulkOrderPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceId, setReferenceId] = useState<string | null>(null);

  // Form states
  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("School");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  
  const [cbseTextbooks, setCbseTextbooks] = useState(false);
  const [icseTextbooks, setIcseTextbooks] = useState(false);
  const [stationery, setStationery] = useState(false);
  const [customNotebooks, setCustomNotebooks] = useState(false);
  const [novels, setNovels] = useState(false);
  
  const [qtyRange, setQtyRange] = useState("50-200");
  const [needCustomPrint, setNeedCustomPrint] = useState("No");
  const [comments, setComments] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    document.title = "Institutional Bulk Procurement | Avenue Book Centre";
  }, []);

  const getProductCategoriesStr = () => {
    const list = [];
    if (cbseTextbooks) list.push("CBSE Textbooks");
    if (icseTextbooks) list.push("ICSE Textbooks");
    if (stationery) list.push("Office Stationery");
    if (customNotebooks) list.push("Customized Printed Notebooks");
    if (novels) list.push("Fiction/Non-Fiction Novels");
    return list.join(", ") || "General Inquiry";
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!orgName || !contactName || !email || !phone) {
        setError("Please fill out all required contact and organization fields.");
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      setError(null);
      setStep(3);
    }
  };

  const handleBack = () => {
    setError(null);
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const categoriesStr = getProductCategoriesStr();
    const finalComments = `${comments}\n\nDelivery Date Target: ${deliveryDate}\nShipping Target: ${shippingAddress}\nNeed Custom Printing: ${needCustomPrint}`;

    try {
      const res = await createBulkOrder({
        organizationName: orgName,
        orgType,
        productCategory: categoriesStr,
        quantityRange: qtyRange,
        contactName,
        email,
        phone,
        comments: finalComments
      });

      if (res.success && res.id) {
        setReferenceId(res.id);
        setStep(4);
      } else {
        setError(res.error || "Failed to submit bulk order request.");
      }
    } catch (e: any) {
      setError(e.message || "Security gateway communication timeout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "var(--bg-primary)", minHeight: "calc(100vh - 5rem)", padding: "3.5rem 0 6rem 0" }}>
      <div className="container" style={{ maxWidth: "800px" }}>
        
        {/* Step Indicator Top Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span style={{ fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase", color: "var(--brand-primary)", letterSpacing: "0.1em", display: "block", marginBottom: "0.5rem" }}>
            Wholesale &amp; Institutional Sales
          </span>
          <h1 style={{ fontSize: "2.5rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            Bulk Order Procurement Program
          </h1>
          <p className="text-muted" style={{ marginTop: "0.5rem", fontSize: "1.05rem" }}>
            Discounted textbooks, custom printed notebooks, and school/office supplies in high volume.
          </p>

          {/* Wizard step dots */}
          {step < 4 && (
            <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "2rem" }}>
              {[1, 2, 3].map(num => (
                <div key={num} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: step === num ? "var(--brand-primary)" : step > num ? "var(--success)" : "var(--border-color)",
                    color: step >= num ? "#ffffff" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    transition: "all 0.3s"
                  }}>
                    {step > num ? "✓" : num}
                  </div>
                  <span style={{
                    fontSize: "0.85rem",
                    fontWeight: step === num ? 700 : 500,
                    color: step === num ? "var(--text-primary)" : "var(--text-muted)"
                  }}>
                    {num === 1 ? "Organization" : num === 2 ? "Interest & Volume" : "Logistics"}
                  </span>
                  {num < 3 && <div style={{ width: "40px", height: "2px", background: step > num ? "var(--success)" : "var(--border-color)" }} />}
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ 
            backgroundColor: "rgba(239, 68, 68, 0.05)", 
            border: "1px solid var(--danger)", 
            color: "var(--danger)", 
            padding: "1rem 1.5rem", 
            borderRadius: "var(--radius-md)", 
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.9rem"
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Form Wrapper */}
        <div className="card" style={{ padding: "2.5rem", background: "#ffffff", boxShadow: "0 10px 30px rgba(0,0,0,0.02)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-xl)" }}>
          
          {step === 1 && (
            <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Building2 size={20} color="var(--brand-primary)" /> Step 1: Institutional Details
              </h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Institution / Company Name *</label>
                  <div style={{ position: "relative" }}>
                    <Building2 size={16} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hill Road International School" 
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="input-base"
                      style={{ width: "100%", paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Organization Type *</label>
                  <select 
                    value={orgType} 
                    onChange={(e) => setOrgType(e.target.value)}
                    className="input-base"
                    style={{ width: "100%", background: "#ffffff", padding: "0.85rem 1rem" }}
                  >
                    <option value="School">K-12 School (CBSE/ICSE)</option>
                    <option value="University">College / University</option>
                    <option value="Corporate">Corporate Office</option>
                    <option value="Bookstore">Retail Bookstore</option>
                    <option value="Other">Government / Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Contact Person Name *</label>
                <div style={{ position: "relative" }}>
                  <User size={16} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Prof. Rajesh Sharma" 
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="input-base"
                    style={{ width: "100%", paddingLeft: "2.5rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Corporate Email *</label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      type="email" 
                      required
                      placeholder="e.g. procurement@hillschool.edu" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-base"
                      style={{ width: "100%", paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Phone Number *</label>
                  <div style={{ position: "relative" }}>
                    <Phone size={16} color="var(--text-muted)" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
                    <input 
                      type="tel" 
                      required
                      placeholder="10-digit number" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-base"
                      style={{ width: "100%", paddingLeft: "2.5rem" }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                  Next Step: Products <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleNext} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BookOpen size={20} color="var(--brand-primary)" /> Step 2: Target Categories &amp; Volumetric Needs
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Material Categories Needed (Select all that apply)</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", background: "var(--bg-primary)", padding: "1.25rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                  
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input 
                      type="checkbox" 
                      checked={cbseTextbooks}
                      onChange={(e) => setCbseTextbooks(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                    />
                    CBSE School Textbooks
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input 
                      type="checkbox" 
                      checked={icseTextbooks}
                      onChange={(e) => setIcseTextbooks(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                    />
                    ICSE School Textbooks
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input 
                      type="checkbox" 
                      checked={stationery}
                      onChange={(e) => setStationery(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                    />
                    Office &amp; Writing Stationery
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input 
                      type="checkbox" 
                      checked={customNotebooks}
                      onChange={(e) => setCustomNotebooks(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                    />
                    Customized Printed Journals
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}>
                    <input 
                      type="checkbox" 
                      checked={novels}
                      onChange={(e) => setNovels(e.target.checked)}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                    />
                    General Novels &amp; Fiction
                  </label>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Estimated Order Quantity (Total Units)</label>
                  <select 
                    value={qtyRange} 
                    onChange={(e) => setQtyRange(e.target.value)}
                    className="input-base"
                    style={{ width: "100%", background: "#ffffff", padding: "0.85rem 1rem" }}
                  >
                    <option value="50-200">50 - 200 units (Small Institutional)</option>
                    <option value="200-500">200 - 500 units (Standard wholesale)</option>
                    <option value="500-1000">500 - 1,000 units (High volume)</option>
                    <option value="1000+">1,000+ units (Bulk distribution)</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Do you need Custom Brand Printing?</label>
                  <select 
                    value={needCustomPrint} 
                    onChange={(e) => setNeedCustomPrint(e.target.value)}
                    className="input-base"
                    style={{ width: "100%", background: "#ffffff", padding: "0.85rem 1rem" }}
                  >
                    <option value="No">No, stock products only</option>
                    <option value="Yes">Yes, imprint logo on cover/material</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                <button type="button" onClick={handleBack} className="btn btn-outline" style={{ padding: "0.85rem 2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.85rem 2rem", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
                  Next Step: Logistics <ArrowRight size={18} />
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Truck size={20} color="var(--brand-primary)" /> Step 3: Logistics &amp; Delivery Parameters
              </h2>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Target Delivery Date</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Shipment Delivery Address</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hill Road campus, Bandra" 
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="input-base"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: 700 }}>Specific Titles / Details of inquiry</label>
                <textarea 
                  placeholder="Paste details, list of books, ISBN codes, custom cover prints requirement details..." 
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                  className="input-base"
                  style={{ width: "100%", fontFamily: "inherit" }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.5rem", background: "rgba(14, 165, 233, 0.05)", border: "1px solid rgba(14, 165, 233, 0.2)", padding: "1rem", borderRadius: "8px", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                <HelpCircle size={18} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
                <span>We support dynamic delivery routes across Mumbai and global shipping via trusted logistic partners. Heavy discounts (up to 30%) are applied dynamically to wholesale checkout items.</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
                <button type="button" onClick={handleBack} className="btn btn-outline" style={{ padding: "0.85rem 2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: "0.85rem 2.5rem", fontSize: "1rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", border: "none", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)" }}>
                  {loading ? "Submitting Inquiry..." : <>Submit Bulk Inquiry <CheckCircle2 size={18} /></>}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div style={{ textAlign: "center", padding: "2rem 1rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.1)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 style={{ fontSize: "1.75rem", fontWeight: 800, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                  Bulk Inquiry Successfully Filed!
                </h2>
                <p className="text-muted" style={{ margin: 0, fontSize: "1rem" }}>
                  Thank you for your interest. A dedicated Avenue Book Centre representative will verify stock and contact you within 4 hours.
                </p>
              </div>

              <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-lg)", padding: "1.5rem 2rem", display: "inline-flex", flexDirection: "column", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Procurement Reference ID
                </span>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--brand-primary)", fontFamily: "monospace" }}>
                  {referenceId || "ABC-BULK-WAIT"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", background: "#f8fafc", padding: "0.85rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.85rem" }}>
                <FileSpreadsheet size={16} color="var(--success)" />
                <span>We sent a confirmation email copy to <strong>{email}</strong> detailing the next steps of your order flow.</span>
              </div>

              <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                <Link href="/" className="btn btn-outline">
                  Return Home
                </Link>
                <Link href="/products" className="btn btn-primary">
                  Browse Catalog
                </Link>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
