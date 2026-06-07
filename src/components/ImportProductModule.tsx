"use client";

import { useState } from "react";
import { importProductFromUrl } from "@/app/actions";
import { Link2, Loader2, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

interface ImportProductModuleProps {
  currencySymbol?: string;
}

export default function ImportProductModule({ currencySymbol = "₹" }: ImportProductModuleProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importedProduct, setImportedProduct] = useState<any>(null);

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);
    setImportedProduct(null);

    try {
      const res = await importProductFromUrl(url.trim());
      if (res.success && res.product) {
        setImportedProduct(res.product);
        setUrl("");
        // Refresh products list in background
        router.refresh();
      } else {
        setError(res.error || "Scraping protocol could not parse product metadata.");
      }
    } catch (err: any) {
      setError("An unexpected network error occurred while crawling web content.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid var(--border-color)",
      borderRadius: "var(--radius-lg)",
      padding: "2rem",
      marginBottom: "2.5rem",
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "150px",
        height: "150px",
        background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
        filter: "blur(30px)",
        opacity: 0.5,
        zIndex: 0,
        pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
          <div style={{
            width: "36px",
            height: "36px",
            background: "var(--brand-glow)",
            color: "var(--brand-primary)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Link2 size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 700, color: "var(--text-primary)" }}>
              Instant Product Web Importer
            </h3>
            <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
              Ingest remote catalog listings automatically by pasting their URL address below.
            </p>
          </div>
        </div>

        {/* Input Form */}
        {!importedProduct && (
          <form onSubmit={handleImport} style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
            <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
              <input
                type="url"
                required
                placeholder="Paste Amazon, Shopify, or external product page URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "0.85rem 1.25rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-color)",
                  outline: "none",
                  fontSize: "0.9rem",
                  background: isLoading ? "var(--bg-secondary)" : "#ffffff",
                  transition: "border var(--transition-fast)"
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="btn btn-primary"
              style={{
                padding: "0.85rem 2rem",
                fontSize: "0.95rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: "150px",
                justifyContent: "center"
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scraping...
                </>
              ) : (
                "Import Product"
              )}
            </button>
          </form>
        )}

        {/* Error Callout */}
        {error && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "var(--danger)",
            padding: "1rem",
            borderRadius: "var(--radius-md)",
            marginTop: "1.5rem",
            fontSize: "0.875rem"
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <div><strong>Import Blocked:</strong> {error}</div>
          </div>
        )}

        {/* Success Preview */}
        {importedProduct && (
          <div style={{
            marginTop: "1.5rem",
            padding: "1.5rem",
            background: "rgba(16, 185, 129, 0.04)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: "var(--radius-md)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <CheckCircle2 size={24} color="var(--success)" />
                <div>
                  <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#065f46" }}>
                    Successfully Imported & Logged!
                  </h4>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#047857" }}>
                    Automated scraping successfully parsed and populated database records.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImportedProduct(null)}
                className="btn btn-outline"
                style={{
                  padding: "0.4rem 0.8rem",
                  fontSize: "0.75rem",
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  color: "#047857",
                  background: "transparent"
                }}
              >
                Import Another URL
              </button>
            </div>

            {/* Product Card Preview */}
            <div style={{
              display: "flex",
              gap: "1.5rem",
              background: "#ffffff",
              padding: "1.25rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-color)",
              flexWrap: "wrap"
            }}>
              {importedProduct.imageUrl && (
                <img
                  src={importedProduct.imageUrl}
                  alt={importedProduct.name}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "cover",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-color)",
                    background: "var(--bg-tertiary)"
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: "200px" }}>
                <span style={{
                  fontSize: "0.75rem",
                  color: "var(--brand-primary)",
                  fontWeight: 700,
                  textTransform: "uppercase"
                }}>
                  {importedProduct.category?.name || "Imported Catalog"}
                </span>
                <h5 style={{ fontSize: "1.1rem", margin: "0.25rem 0", fontWeight: 700 }}>
                  {importedProduct.name}
                </h5>
                <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0.75rem 0", lineHeight: 1.4 }}>
                  {importedProduct.description}
                </p>
                
                {/* Stats */}
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", fontSize: "0.8rem", fontWeight: 600 }}>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>SKU: </span>
                    <span style={{ fontFamily: "monospace" }}>{importedProduct.sku}</span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Price: </span>
                    {importedProduct.discountPrice !== null && importedProduct.discountPrice !== undefined ? (
                      <span style={{ color: "#065f46" }}>
                        <span style={{ textDecoration: "line-through", color: "var(--text-muted)", marginRight: "0.4rem" }}>
                          {currencySymbol}{importedProduct.price.toFixed(2)}
                        </span>
                        {currencySymbol}{importedProduct.discountPrice.toFixed(2)}
                      </span>
                    ) : (
                      <span style={{ color: "#065f46" }}>{currencySymbol}{importedProduct.price.toFixed(2)}</span>
                    )}
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>Weight: </span>
                    <span>{importedProduct.weight.toFixed(2)} kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
