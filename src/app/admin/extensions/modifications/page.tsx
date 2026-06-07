"use client";

import { useState, useEffect } from "react";
import { Wrench, CheckCircle2, AlertCircle, RefreshCw, Trash2, ShieldCheck, Play } from "lucide-react";
import Link from "next/link";

interface Modification {
  id: string;
  name: string;
  code: string;
  author: string;
  version: string;
  status: "enabled" | "disabled";
  xmlSource: string;
}

export default function ModificationsPage() {
  const [mods, setMods] = useState<Modification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    // Load pre-seeded and dynamically uploaded modifications
    setTimeout(() => {
      let uploaded: any[] = [];
      try {
        const uploadedStr = localStorage.getItem("installed_extensions");
        if (uploadedStr) {
          uploaded = JSON.parse(uploadedStr);
        }
      } catch (e) {}

      const initialMods: Modification[] = [
        {
          id: "mod_logo_rebrand",
          name: "AvenueBookCentre Branding Hook",
          code: "abc_branding_hook",
          author: "ABC Tech Support",
          version: "1.1",
          status: "enabled",
          xmlSource: `<?xml version="1.0" encoding="utf-8"?>
<modification>
  <name>AvenueBookCentre Branding Hook</name>
  <code>abc_branding_hook</code>
  <version>1.1</version>
  <author>ABC Tech Support</author>
  <link>http://localhost:3000</link>
  <file path="catalog/view/theme/default/template/common/header.twig">
    <operation>
      <search><![CDATA[{{ logo }}]]></search>
      <add position="replace"><![CDATA[<img src="/logo.png" alt="AvenueBookCentre" />]]></add>
    </operation>
  </file>
</modification>`
        },
        {
          id: "mod_subcategory_filter",
          name: "Deep Nested Subcategory Aggregator",
          code: "abc_subcategory_aggregator",
          author: "ABC Tech Support",
          version: "1.0",
          status: "enabled",
          xmlSource: `<?xml version="1.0" encoding="utf-8"?>
<modification>
  <name>Deep Nested Subcategory Aggregator</name>
  <code>abc_subcategory_aggregator</code>
  <version>1.0</version>
  <author>ABC Tech Support</author>
  <file path="catalog/model/catalog/product.php">
    <operation>
      <search><![CDATA[$sql .= " AND p2c.category_id = '" . (int)$data['filter_category_id'] . "'";]]></search>
      <add position="replace"><![CDATA[// Deep nested query modification logic]]></add>
    </operation>
  </file>
</modification>`
        }
      ];

      uploaded.filter(u => u.type === "Modification").forEach((u, idx) => {
        initialMods.push({
          id: `uploaded_${u.code}`,
          name: u.name,
          code: u.code,
          author: u.author || "Community Contributor",
          version: "1.0.0",
          status: "enabled",
          xmlSource: `<?xml version="1.0" encoding="utf-8"?>\n<modification>\n  <name>${u.name}</name>\n  <code>${u.code}</code>\n</modification>`
        });
      });

      setMods(initialMods);
      setLoading(false);
    }, 500);
  }, []);

  const handleRefreshCache = () => {
    setRefreshing(true);
    // Simulate rebuilding modifications cache
    setTimeout(() => {
      setRefreshing(false);
      showToast("✅ Modifications cache successfully rebuilt!");
    }, 1500);
  };

  const toggleStatus = (id: string) => {
    setMods(prev => prev.map(m => {
      if (m.id === id) {
        const nextStatus = m.status === "enabled" ? "disabled" : "enabled";
        return { ...m, status: nextStatus };
      }
      return m;
    }));
    showToast("Modification status updated. Click 'Refresh' to apply changes.");
  };

  const handleDeleteMod = (id: string) => {
    setMods(prev => prev.filter(m => m.id !== id));
    showToast("Modification deleted. Click 'Refresh' to apply changes.");
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
            Modifications (OCMOD)
          </h1>
          <p className="text-muted" style={{ margin: "0.25rem 0 0 0" }}>
            Manage core framework modifications. Always click the **Refresh** button to rebuild the cache after changes.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={handleRefreshCache}
            disabled={refreshing}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700 }}
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Rebuilding Cache..." : "Refresh Modifications"}
          </button>
        </div>
      </div>

      {/* Modifications table */}
      <div className="card" style={{ padding: 0, overflow: "hidden", background: "#ffffff" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
            Loading Modifications...
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-tertiary)", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Modification Name</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Code</th>
                <th style={{ padding: "1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Author</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Version</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Status</th>
                <th style={{ padding: "1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mods.map((mod, idx) => (
                <tr key={mod.id} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 0 ? "#ffffff" : "var(--bg-primary)" }}>
                  <td style={{ padding: "1rem", fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>
                    {mod.name}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                    {mod.code}
                  </td>
                  <td style={{ padding: "1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                    {mod.author}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center", fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                    {mod.version}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <span style={{
                      padding: "0.25rem 0.6rem", borderRadius: "12px", fontSize: "0.72rem", fontWeight: 800,
                      background: mod.status === "enabled" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                      color: mod.status === "enabled" ? "#10b981" : "#ef4444",
                    }}>
                      {mod.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button
                        onClick={() => toggleStatus(mod.id)}
                        className="btn btn-outline"
                        style={{ padding: "0.3rem 0.75rem", fontSize: "0.75rem", minHeight: "32px" }}
                      >
                        {mod.status === "enabled" ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDeleteMod(mod.id)}
                        style={{ padding: "0.4rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.05)", color: "#ef4444", display: "flex", alignItems: "center" }}
                        title="Delete modification"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
