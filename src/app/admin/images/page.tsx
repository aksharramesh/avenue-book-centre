"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload, Image as ImageIcon, Trash2, Copy, Check, Search,
  X, FolderOpen, ZoomIn, LayoutGrid, List, RefreshCw, FileImage
} from "lucide-react";

interface ImageFile {
  name: string;
  url: string;
  size: number;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export default function ImageManagerPage() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [filtered, setFiltered] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selected, setSelected] = useState<string | null>(null); // preview
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Load images ───────────────────────────────────────────────────────────
  const loadImages = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/images");
      const data = await res.json();
      setImages(data.images || []);
    } catch {
      showToast("Failed to load images.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadImages(); }, [loadImages]);

  // ── Search filter ─────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(q ? images.filter((i) => i.name.toLowerCase().includes(q)) : images);
  }, [search, images]);

  // ── Toast helper ──────────────────────────────────────────────────────────
  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Upload handler ────────────────────────────────────────────────────────
  async function uploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadProgress([]);

    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("files", f));

    try {
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (data.uploaded?.length) {
        showToast(`✅ ${data.uploaded.length} image(s) uploaded successfully!`, "success");
      }
      if (data.errors?.length) {
        setUploadProgress(data.errors);
        showToast(`⚠️ ${data.errors.length} file(s) had errors.`, "error");
      }
      await loadImages();
    } catch {
      showToast("Upload failed. Please try again.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Drag & drop ───────────────────────────────────────────────────────────
  function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
  function onDragLeave() { setIsDragging(false); }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  }

  // ── Copy URL ──────────────────────────────────────────────────────────────
  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(window.location.origin + url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
    showToast("URL copied to clipboard!", "success");
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function deleteImage(name: string) {
    try {
      await fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setImages((prev) => prev.filter((i) => i.name !== name));
      if (selected && selected === images.find((i) => i.name === name)?.url) setSelected(null);
      showToast("Image deleted.", "success");
    } catch {
      showToast("Delete failed.", "error");
    } finally {
      setDeleteConfirm(null);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  const totalSize = images.reduce((s, i) => s + i.size, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", position: "relative" }}>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: "2rem", right: "2rem", zIndex: 9999,
          background: toast.type === "success" ? "#10b981" : "#ef4444",
          color: "#fff", padding: "0.85rem 1.5rem", borderRadius: "12px",
          fontWeight: 600, fontSize: "0.875rem", boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
          display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "360px",
          animation: "fadeIn 0.25s ease",
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "2.25rem", fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.4rem 0" }}>
            Image Manager
          </h1>
          <p className="text-muted" style={{ margin: 0 }}>
            {images.length} images · {formatBytes(totalSize)} total storage
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={loadImages} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-secondary)", fontWeight: 600, cursor: "pointer", fontSize: "0.875rem" }}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.5rem", fontWeight: 700 }}
          >
            <Upload size={16} /> Upload Images
          </button>
          <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
        </div>
      </div>

      {/* ── Drag & Drop Zone ──────────────────────────────────────────────── */}
      <div
        ref={dropRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${isDragging ? "var(--brand-primary)" : "var(--border-color)"}`,
          borderRadius: "var(--radius-lg, 16px)",
          padding: "2.5rem",
          textAlign: "center",
          background: isDragging ? "rgba(14,165,233,0.05)" : "var(--bg-primary)",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
        }}
      >
        {uploading ? (
          <>
            <div style={{ width: "48px", height: "48px", border: "4px solid var(--border-color)", borderTopColor: "var(--brand-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>Uploading...</span>
          </>
        ) : (
          <>
            <div style={{ width: "56px", height: "56px", background: "rgba(14,165,233,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Upload size={26} color="var(--brand-primary)" />
            </div>
            <div>
              <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
                Drag &amp; drop images here
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", display: "block", marginTop: "0.25rem" }}>
                or click to browse · JPEG, PNG, GIF, WebP, SVG · max 10 MB per file
              </span>
            </div>
          </>
        )}
        {uploadProgress.length > 0 && (
          <ul style={{ margin: "0.5rem 0 0 0", padding: 0, listStyle: "none", textAlign: "left" }}>
            {uploadProgress.map((e, i) => (
              <li key={i} style={{ color: "#ef4444", fontSize: "0.8rem" }}>⚠️ {e}</li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: "220px", display: "flex", alignItems: "center", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.5rem 1rem", gap: "0.5rem" }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search images by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem", color: "var(--text-primary)" }}
          />
          {search && <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}><X size={14} color="var(--text-muted)" /></button>}
        </div>

        {/* View toggle */}
        <div style={{ display: "flex", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: "0.5rem 0.85rem", border: "none", cursor: "pointer",
                background: view === v ? "var(--brand-primary)" : "transparent",
                color: view === v ? "#fff" : "var(--text-muted)",
                display: "flex", alignItems: "center", gap: "0.4rem",
                fontSize: "0.82rem", fontWeight: 600, transition: "all 0.15s",
              }}
            >
              {v === "grid" ? <LayoutGrid size={16} /> : <List size={16} />}
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
          {filtered.length} of {images.length} images
        </span>
      </div>

      {/* ── Image Grid / List ─────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--border-color)", borderTopColor: "var(--brand-primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 1rem" }} />
          Loading images...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
          <FolderOpen size={48} style={{ opacity: 0.3, marginBottom: "1rem" }} />
          <div style={{ fontWeight: 600, fontSize: "1.1rem", color: "var(--text-secondary)" }}>
            {search ? "No images match your search" : "No images uploaded yet"}
          </div>
          <div style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
            {search ? "Try a different keyword" : "Drag & drop or click 'Upload Images' to get started"}
          </div>
        </div>
      ) : view === "grid" ? (
        /* ── Grid View ────────────────────────────────────────────────────── */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
          {filtered.map((img) => (
            <div
              key={img.name}
              style={{
                background: "#fff", borderRadius: "var(--radius-md)", overflow: "hidden",
                border: "1px solid var(--border-color)", position: "relative",
                transition: "box-shadow 0.2s, transform 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 20px rgba(0,0,0,0.12)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.06)";
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
              }}
            >
              {/* Thumbnail */}
              <div
                style={{ width: "100%", height: "140px", overflow: "hidden", cursor: "pointer", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                onClick={() => setSelected(img.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
                <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0)", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.3)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
                >
                  <ZoomIn size={24} color="#fff" style={{ opacity: 0, transition: "opacity 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  />
                </div>
              </div>

              {/* Info + Actions */}
              <div style={{ padding: "0.65rem 0.75rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "0.15rem" }} title={img.name}>
                  {img.name.replace(/^\d+_/, "")}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{formatBytes(img.size)}</div>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.6rem" }}>
                  <button
                    onClick={() => copyUrl(img.url)}
                    title="Copy URL"
                    style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.3rem", padding: "0.4rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: copiedUrl === img.url ? "#dcfce7" : "var(--bg-primary)", color: copiedUrl === img.url ? "#16a34a" : "var(--text-muted)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, transition: "all 0.15s" }}
                  >
                    {copiedUrl === img.url ? <Check size={12} /> : <Copy size={12} />}
                    {copiedUrl === img.url ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(img.name)}
                    title="Delete"
                    style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ── List View ────────────────────────────────────────────────────── */
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--border-color)" }}>
                <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Preview</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Filename</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Size</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Uploaded</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "left", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>URL</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "center", fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((img, idx) => (
                <tr key={img.name} style={{ borderBottom: "1px solid var(--border-color)", background: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name}
                      style={{ width: "52px", height: "52px", objectFit: "cover", borderRadius: "6px", border: "1px solid var(--border-color)", cursor: "pointer" }}
                      onClick={() => setSelected(img.url)}
                      loading="lazy"
                    />
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem", color: "var(--text-primary)", fontWeight: 600, maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {img.name.replace(/^\d+_/, "")}
                    <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 400 }}>{img.name}</div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>{formatBytes(img.size)}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{formatDate(img.createdAt)}</td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>{img.url}</code>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "0.5rem", justifyContent: "center" }}>
                      <button onClick={() => copyUrl(img.url)} title="Copy URL" style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", background: copiedUrl === img.url ? "#dcfce7" : "var(--bg-primary)", color: copiedUrl === img.url ? "#16a34a" : "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
                        {copiedUrl === img.url ? <Check size={13} /> : <Copy size={13} />} Copy URL
                      </button>
                      <button onClick={() => setDeleteConfirm(img.name)} title="Delete" style={{ padding: "0.4rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.06)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Lightbox Preview ──────────────────────────────────────────────── */}
      {selected && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}
          onClick={() => setSelected(null)}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected} alt="Preview" style={{ maxWidth: "90vw", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} />
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={() => copyUrl(selected)} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "none", background: "var(--brand-primary)", color: "#fff", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Copy size={15} /> Copy URL
              </button>
              <button onClick={() => setSelected(null)} style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <X size={15} /> Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "2rem", maxWidth: "400px", width: "100%", boxShadow: "0 24px 48px rgba(0,0,0,0.25)", textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", background: "rgba(239,68,68,0.1)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1rem" }}>
              <Trash2 size={24} color="#ef4444" />
            </div>
            <h3 style={{ fontWeight: 800, color: "var(--text-primary)", margin: "0 0 0.5rem 0", fontSize: "1.15rem" }}>Delete Image?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", margin: "0 0 1.5rem 0", lineHeight: 1.5 }}>
              <strong>{deleteConfirm.replace(/^\d+_/, "")}</strong> will be permanently deleted and cannot be recovered.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "0.7rem 1.5rem", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", fontWeight: 600, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={() => deleteImage(deleteConfirm)} style={{ padding: "0.7rem 1.5rem", borderRadius: "8px", border: "none", background: "#ef4444", color: "#fff", fontWeight: 700, cursor: "pointer" }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
