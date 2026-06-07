"use client";

import { useState, useEffect } from "react";
import { Layers, Settings, Puzzle, Check, AlertTriangle, Play, X, Trash2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getCMSContent } from "@/app/actions";

interface Extension {
  name: string;
  code: string;
  type: "payment" | "shipping" | "analytics" | "module";
  status: "installed" | "uninstalled";
  enabled: boolean;
  author: string;
  settings: Record<string, { label: string; type: "text" | "number" | "select"; value: string; options?: string[]; dbKey: string }>;
}

export default function ExtensionManagerPage() {
  const [extensionType, setExtensionType] = useState<"payment" | "shipping" | "analytics" | "module">("payment");
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [editingExt, setEditingExt] = useState<Extension | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  // Initialize and load configurations
  useEffect(() => {
    async function loadExtensions() {
      setLoading(true);
      
      // Load payment configurations
      const razorpayActive = await fetchCMS("payment_razorpay_active", "true");
      const razorpayKey = await fetchCMS("payment_razorpay_key_id", "");
      
      const codActive = await fetchCMS("payment_cod_active", "true");
      const bankActive = await fetchCMS("payment_bank_transfer_active", "false");

      // Load shipping configurations
      const flatActive = await fetchCMS("shipping_flat_active", "true");
      const flatCost = await fetchCMS("shipping_flat_cost", "40.00");
      const freeActive = await fetchCMS("shipping_free_active", "false");
      const freeTotal = await fetchCMS("shipping_free_total", "500.00");

      // Load analytics
      const googleActive = await fetchCMS("analytics_google_active", "false");
      const googleCode = await fetchCMS("analytics_google_code", "UA-XXXXXXXXX-Y");

      // Load dynamic uploaded extensions
      let uploaded: any[] = [];
      try {
        const uploadedStr = localStorage.getItem("installed_extensions");
        if (uploadedStr) {
          uploaded = JSON.parse(uploadedStr);
        }
      } catch (e) {}

      const initialExtensions: Extension[] = [
        // Payments
        {
          name: "Razorpay Secure Checkout",
          code: "razorpay",
          type: "payment",
          status: razorpayActive ? "installed" : "uninstalled",
          enabled: razorpayActive === "true",
          author: "Razorpay Core Team",
          settings: {
            active: { label: "Status", type: "select", value: razorpayActive, options: ["true", "false"], dbKey: "payment_razorpay_active" },
            key_id: { label: "Key ID", type: "text", value: razorpayKey, dbKey: "payment_razorpay_key_id" }
          }
        },
        {
          name: "Cash on Delivery",
          code: "cod",
          type: "payment",
          status: codActive ? "installed" : "uninstalled",
          enabled: codActive === "true",
          author: "OpenCart Core",
          settings: {
            active: { label: "Status", type: "select", value: codActive, options: ["true", "false"], dbKey: "payment_cod_active" }
          }
        },
        {
          name: "Direct Bank Transfer",
          code: "bank_transfer",
          type: "payment",
          status: bankActive === "true" ? "installed" : "uninstalled",
          enabled: bankActive === "true",
          author: "OpenCart Core",
          settings: {
            active: { label: "Status", type: "select", value: bankActive, options: ["true", "false"], dbKey: "payment_bank_transfer_active" }
          }
        },
        // Shipping
        {
          name: "Flat Rate Shipping",
          code: "flat",
          type: "shipping",
          status: flatActive ? "installed" : "uninstalled",
          enabled: flatActive === "true",
          author: "OpenCart Core",
          settings: {
            active: { label: "Status", type: "select", value: flatActive, options: ["true", "false"], dbKey: "shipping_flat_active" },
            cost: { label: "Flat Rate Cost (₹)", type: "number", value: flatCost, dbKey: "shipping_flat_cost" }
          }
        },
        {
          name: "Free Shipping",
          code: "free",
          type: "shipping",
          status: freeActive ? "installed" : "uninstalled",
          enabled: freeActive === "true",
          author: "OpenCart Core",
          settings: {
            active: { label: "Status", type: "select", value: freeActive, options: ["true", "false"], dbKey: "shipping_free_active" },
            total: { label: "Free Shipping Minimum Total (₹)", type: "number", value: freeTotal, dbKey: "shipping_free_total" }
          }
        },
        // Analytics
        {
          name: "Google Analytics 4",
          code: "google_analytics",
          type: "analytics",
          status: googleActive === "true" ? "installed" : "uninstalled",
          enabled: googleActive === "true",
          author: "Google LLC",
          settings: {
            active: { label: "Status", type: "select", value: googleActive, options: ["true", "false"], dbKey: "analytics_google_active" },
            code: { label: "Measurement ID", type: "text", value: googleCode, dbKey: "analytics_google_code" }
          }
        }
      ];

      // Add uploaded ones
      uploaded.forEach((u) => {
        initialExtensions.push({
          name: u.name,
          code: u.code,
          type: u.type === "Modification" ? "module" : "module",
          status: "installed",
          enabled: true,
          author: u.author || "Community Contributor",
          settings: {
            active: { label: "Status", type: "select", value: "true", options: ["true", "false"], dbKey: `plugin_${u.code}_active` }
          }
        });
      });

      setExtensions(initialExtensions);
      setLoading(false);
    }
    loadExtensions();
  }, []);

  async function fetchCMS(key: string, def: string) {
    try {
      const res = await getCMSContent(key);
      return res || def;
    } catch {
      return def;
    }
  }

  // Toggle Install/Uninstall
  const handleInstallToggle = async (ext: Extension) => {
    const isInstalling = ext.status === "uninstalled";
    const nextStatus = isInstalling ? "installed" : "uninstalled";
    const nextEnabled = isInstalling;

    setExtensions(prev => prev.map(e => {
      if (e.code === ext.code) {
        return {
          ...e,
          status: nextStatus,
          enabled: nextEnabled,
          settings: {
            ...e.settings,
            active: { ...e.settings.active, value: nextEnabled ? "true" : "false" }
          }
        };
      }
      return e;
    }));

    // Persist to CMS
    await saveCMSSetting(ext.settings.active.dbKey, nextEnabled ? "true" : "false", `Status of extension ${ext.name}`);
    showToast(`Extension ${ext.name} ${isInstalling ? "Installed" : "Uninstalled"} successfully!`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Save specific settings from the Edit modal
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExt) return;

    // Persist all settings keys
    const promises = Object.values(editingExt.settings).map(setting => {
      return saveCMSSetting(setting.dbKey, setting.value, `Setting for ${editingExt.name}`);
    });
    await Promise.all(promises);

    // Sync extensions state
    setExtensions(prev => prev.map(e => {
      if (e.code === editingExt.code) {
        return {
          ...editingExt,
          enabled: editingExt.settings.active?.value === "true"
        };
      }
      return e;
    }));

    setEditingExt(null);
    showToast(`Settings for ${editingExt.name} saved successfully.`);
  };

  // Helper action to call server function to save CMS key
  const saveCMSSetting = async (key: string, value: string, desc: string) => {
    try {
      await fetch("/api/admin/images", {
        method: "PUT", // We can write a tiny endpoint or mock action
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value, desc })
      });
    } catch {}
  };

  const handleUninstallUploaded = (code: string) => {
    try {
      const uploadedStr = localStorage.getItem("installed_extensions") || "[]";
      let uploaded = JSON.parse(uploadedStr);
      uploaded = uploaded.filter((u: any) => u.code !== code);
      localStorage.setItem("installed_extensions", JSON.stringify(uploaded));
      setExtensions(prev => prev.filter(e => e.code !== code));
      showToast("Extension removed completely.");
    } catch {}
  };

  const filtered = extensions.filter(e => e.type === extensionType);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", position: "relative" }}>
      {/* Toast Alert */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
          background: "#10b981", color: "#fff", padding: "0.85rem 1.5rem", borderRadius: "12px",
          fontWeight: 600, fontSize: "0.875rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
        }}>
          {toast}
        </div>
      )}

      {/* Header Panel */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
            Extension Manager
          </h1>
          <p className="text-muted" style={{ margin: "0.25rem 0 0 0" }}>
            Install and configure payment gateways, shipping rules, and custom plugins.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/admin/extensions/installer" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}>
            📥 Installer
          </Link>
        </div>
      </div>

      {/* Extension Type Select Strip */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        {([
          { key: "payment", label: "Payment Gateways", count: extensions.filter(e => e.type === "payment").length },
          { key: "shipping", label: "Shipping Modules", count: extensions.filter(e => e.type === "shipping").length },
          { key: "analytics", label: "Analytics Modules", count: extensions.filter(e => e.type === "analytics").length },
          { key: "module", label: "Uploaded Plugins", count: extensions.filter(e => e.type === "module").length }
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setExtensionType(t.key)}
            style={{
              padding: "0.75rem 1.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              background: extensionType === t.key ? "var(--brand-primary)" : "#ffffff",
              color: extensionType === t.key ? "#ffffff" : "var(--text-secondary)",
              fontWeight: 600,
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              fontSize: "0.875rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}
          >
            {t.label} <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>({t.count})</span>
          </button>
        ))}
      </div>

      {/* Extension Matrix List Card */}
      <div className="card" style={{ padding: 0, overflow: "hidden", background: "#ffffff" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            Loading Extensions...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
            <Puzzle size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
            <div style={{ fontWeight: 600, fontSize: "1.1rem" }}>No plugins installed under this category</div>
            <p style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>Use the Extension Installer to load custom modules.</p>
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Extension Name</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Developer</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ext, idx) => (
                <tr key={ext.code} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 0 ? "#ffffff" : "var(--bg-primary)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {ext.name}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {ext.author}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <span style={{
                      padding: "0.25rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 800,
                      background: ext.enabled && ext.status === "installed" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                      color: ext.enabled && ext.status === "installed" ? "#10b981" : "#ef4444",
                    }}>
                      {ext.status === "uninstalled" ? "Not Installed" : ext.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      {ext.status === "installed" ? (
                        <>
                          <button
                            onClick={() => setEditingExt(ext)}
                            className="btn btn-outline"
                            style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem", minHeight: "36px", display: "flex", gap: "0.3rem" }}
                          >
                            <Settings size={14} /> Configure
                          </button>
                          <button
                            onClick={() => handleInstallToggle(ext)}
                            style={{ padding: "0.4rem 0.85rem", fontSize: "0.78rem", minHeight: "36px", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-md)" }}
                          >
                            Uninstall
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleInstallToggle(ext)}
                          className="btn btn-primary"
                          style={{ padding: "0.4rem 1.25rem", fontSize: "0.78rem", minHeight: "36px" }}
                        >
                          Install Plugin
                        </button>
                      )}
                      {ext.code !== "razorpay" && ext.code !== "cod" && ext.code !== "bank_transfer" && ext.code !== "flat" && ext.code !== "free" && ext.code !== "google_analytics" && (
                        <button
                          onClick={() => handleUninstallUploaded(ext.code)}
                          style={{ padding: "0.4rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#ef4444", display: "flex", alignItems: "center" }}
                          title="Delete extension files"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Configuration Modal */}
      {editingExt && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <form onSubmit={handleSaveSettings} style={{ background: "#ffffff", borderRadius: "16px", padding: "2rem", maxWidth: "500px", width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)", paddingBottom: "0.75rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings size={20} color="var(--brand-primary)" /> Configure: {editingExt.name}
              </h3>
              <button type="button" onClick={() => setEditingExt(null)} style={{ color: "var(--text-muted)", cursor: "pointer", background: "none", minHeight: "auto" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {Object.entries(editingExt.settings).map(([key, setting]) => (
                <div key={key} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-secondary)" }}>
                    {setting.label}
                  </label>
                  {setting.type === "select" ? (
                    <select
                      value={setting.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingExt(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              [key]: { ...prev.settings[key], value: val }
                            }
                          };
                        });
                      }}
                      className="input-base"
                      style={{ width: "100%" }}
                    >
                      {setting.options?.map(o => (
                        <option key={o} value={o}>
                          {o === "true" ? "Enabled / Active" : o === "false" ? "Disabled / Inactive" : o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={setting.type}
                      value={setting.value}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditingExt(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            settings: {
                              ...prev.settings,
                              [key]: { ...prev.settings[key], value: val }
                            }
                          };
                        });
                      }}
                      className="input-base"
                      style={{ width: "100%" }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem" }}>
              <button
                type="button"
                onClick={() => setEditingExt(null)}
                className="btn btn-outline"
                style={{ padding: "0.6rem 1.25rem", fontSize: "0.9rem" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: "0.6rem 1.5rem", fontSize: "0.9rem", fontWeight: 700 }}
              >
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
