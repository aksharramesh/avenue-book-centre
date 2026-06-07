"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search, ChevronDown, ChevronRight, X, Filter } from "lucide-react";

interface SubCategory {
  id: string;
  name: string;
  parentId: string | null;
  children: SubCategory[];
}

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children: SubCategory[];
}

interface Props {
  categories: Category[];
  activeCategoryId?: string;
  activeSearch?: string;
}

export default function ProductsFilter({ categories, activeCategoryId, activeSearch }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(activeSearch || "");
  const [mobileOpen, setMobileOpen] = useState(false);
  // Track which parent sections are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    const checkActiveChild = (c: SubCategory): boolean => {
      if (c.id === activeCategoryId) return true;
      if (c.children && c.children.length > 0) {
        return c.children.some(checkActiveChild);
      }
      return false;
    };
    categories.forEach((cat) => {
      const isParentActive = cat.id === activeCategoryId;
      const isChildActive = cat.children.some(checkActiveChild);
      init[cat.id] = isParentActive || isChildActive || cat.children.length === 0;
    });
    return init;
  });

  function navigate(categoryId?: string, searchTerm?: string) {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    if (searchTerm) params.set("search", searchTerm);
    router.push(`/products${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(activeCategoryId, search.trim() || undefined);
  }

  function clearSearch() {
    setSearch("");
    navigate(activeCategoryId, undefined);
  }

  function clearAll() {
    setSearch("");
    router.push("/products");
  }

  const hasFilters = !!activeCategoryId || !!activeSearch;

  return (
    <div>
      {/* Mobile toggle button */}
      <button
        type="button"
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          width: "100%",
          padding: "0.85rem 1rem",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-md)",
          fontWeight: 700,
          fontSize: "0.875rem",
          display: "none",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          cursor: "pointer",
          color: "var(--text-primary)",
          marginBottom: "1rem",
        }}
        className="mobile-filter-toggle"
      >
        <Filter size={16} />
        {mobileOpen ? "Hide Filters & Search" : "Show Filters & Search"}
      </button>

      <div className={`filter-options-wrapper ${mobileOpen ? "mobile-active" : ""}`} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Search box */}
      <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Search size={14} /> Search
        </div>
        <form onSubmit={handleSearch} style={{ padding: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, author, ISBN..."
              style={{ flex: 1, padding: "0.6rem 0.75rem", border: "1px solid var(--border-color)", borderRadius: "6px", fontSize: "0.85rem", outline: "none", color: "var(--text-primary)" }}
            />
            {search && (
              <button type="button" onClick={clearSearch} style={{ padding: "0.6rem", border: "1px solid var(--border-color)", borderRadius: "6px", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <X size={14} color="var(--text-muted)" />
              </button>
            )}
            <button type="submit" style={{ padding: "0.6rem 0.85rem", background: "var(--brand-primary)", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              <Search size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {activeSearch && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.75rem", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, color: "#0369a1" }}>
              "{activeSearch}"
              <button onClick={clearSearch} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}><X size={11} color="#0369a1" /></button>
            </span>
          )}
          <button onClick={clearAll} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.75rem", background: "transparent", border: "1px solid var(--border-color)", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600, color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={11} /> Clear all
          </button>
        </div>
      )}

      {/* Categories tree */}
      <div style={{ background: "#fff", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid var(--border-color)", fontWeight: 700, fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Filter size={14} /> Browse by Category
        </div>

        {/* All products link */}
        <button
          onClick={() => navigate(undefined, activeSearch || undefined)}
          style={{
            width: "100%", textAlign: "left", padding: "0.8rem 1rem",
            background: !activeCategoryId ? "#f0f9ff" : "transparent",
            borderBottom: "1px solid #f1f5f9", border: "none",
            borderLeft: !activeCategoryId ? "3px solid #0ea5e9" : "3px solid transparent",
            fontWeight: !activeCategoryId ? 800 : 600, fontSize: "0.875rem",
            color: !activeCategoryId ? "#0369a1" : "var(--text-primary)",
            cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
          }}
        >
          All Products
        </button>

        {/* Parent categories with expandable children */}
        {categories.map((cat) => {
          const isParentActive = activeCategoryId === cat.id;
          const hasChildren = cat.children.length > 0;
          const hasActiveDescendant = (c: SubCategory): boolean => {
            if (c.id === activeCategoryId) return true;
            if (c.children && c.children.length > 0) {
              return c.children.some(hasActiveDescendant);
            }
            return false;
          };
          const isChildActive = cat.children.some(hasActiveDescendant);
          const isOpen = expanded[cat.id] ?? (hasChildren ? isChildActive || isParentActive : true);

          return (
            <div key={cat.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
              {/* Parent row */}
              <div style={{ display: "flex", alignItems: "stretch" }}>
                <button
                  onClick={() => navigate(cat.id, activeSearch || undefined)}
                  style={{
                    flex: 1, textAlign: "left", padding: "0.8rem 1rem",
                    background: isParentActive ? "#f0f9ff" : "transparent",
                    border: "none",
                    borderLeft: isParentActive ? "3px solid #0ea5e9" : "3px solid transparent",
                    fontWeight: isParentActive || isChildActive ? 700 : 600,
                    fontSize: "0.875rem",
                    color: isParentActive ? "#0369a1" : isChildActive ? "#0f172a" : "var(--text-primary)",
                    cursor: "pointer",
                  }}
                >
                  {cat.name}
                  {isChildActive && !isParentActive && (
                    <span style={{ marginLeft: "0.5rem", fontSize: "0.7rem", background: "#0ea5e9", color: "#fff", padding: "1px 6px", borderRadius: "999px" }}>
                      {cat.children.filter(c => c.id === activeCategoryId).length}
                    </span>
                  )}
                </button>

                {/* Expand toggle for parent with children */}
                {hasChildren && (
                  <button
                    onClick={() => setExpanded((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))}
                    style={{ padding: "0 0.75rem", border: "none", background: "transparent", cursor: "pointer", color: "var(--text-muted)", display: "flex", alignItems: "center" }}
                  >
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
              </div>

              {/* Subcategories */}
              {hasChildren && isOpen && (
                <div style={{ background: "#fafbfc", borderTop: "1px solid #f1f5f9" }}>
                  {cat.children.map((sub) => {
                    const isSubActive = activeCategoryId === sub.id;
                    const hasSubSubs = sub.children && sub.children.length > 0;
                    const isSubSubActive = sub.children?.some(hasActiveDescendant);

                    return (
                      <div key={sub.id} style={{ display: "flex", flexDirection: "column" }}>
                        <button
                          onClick={() => navigate(sub.id, activeSearch || undefined)}
                          style={{
                            width: "100%", textAlign: "left",
                            padding: "0.65rem 1rem 0.65rem 2rem",
                            background: isSubActive ? "#e0f2fe" : "transparent",
                            border: "none",
                            borderLeft: isSubActive ? "3px solid #0ea5e9" : "3px solid transparent",
                            fontWeight: isSubActive || isSubSubActive ? 700 : 500,
                            fontSize: "0.83rem",
                            color: isSubActive ? "#0369a1" : isSubSubActive ? "#0f172a" : "#475569",
                            cursor: "pointer", display: "block",
                            borderBottom: "1px solid #f1f5f9",
                            transition: "background 0.12s",
                          }}
                          className="filter-sub-hover"
                        >
                          {sub.name}
                        </button>
                        
                        {/* Level 3 items */}
                        {hasSubSubs && (
                          <div style={{ display: "flex", flexDirection: "column", paddingLeft: "1rem", background: "#f8fafc" }}>
                            {sub.children.map((subSub) => {
                              const isSubSubItemActive = activeCategoryId === subSub.id;
                              return (
                                <button
                                  key={subSub.id}
                                  onClick={() => navigate(subSub.id, activeSearch || undefined)}
                                  style={{
                                    width: "100%", textAlign: "left",
                                    padding: "0.5rem 1rem 0.5rem 2.25rem",
                                    background: isSubSubItemActive ? "#bae6fd" : "transparent",
                                    border: "none",
                                    borderLeft: isSubSubItemActive ? "3px solid #0ea5e9" : "3px solid transparent",
                                    fontWeight: isSubSubItemActive ? 700 : 500,
                                    fontSize: "0.78rem",
                                    color: isSubSubItemActive ? "#0369a1" : "#64748b",
                                    cursor: "pointer", display: "block",
                                    borderBottom: "1px solid #f1f5f9",
                                    transition: "background 0.12s",
                                  }}
                                  className="filter-sub-hover"
                                >
                                  • {subSub.name}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      </div>

      <style>{`
        .filter-sub-hover:hover {
          background: #f0f9ff !important;
          color: #0369a1 !important;
        }
      `}</style>
    </div>
  );
}
