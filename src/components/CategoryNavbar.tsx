"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

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

export default function CategoryNavbar({ categories }: { categories: Category[] }) {
  const searchParams = useSearchParams();
  const activeCategoryId = searchParams.get("category");

  return (
    <div style={{ background: "#229ac8", color: "#ffffff", borderBottom: "1px solid #1c7fa4", boxShadow: "0 2px 4px rgba(0,0,0,0.05)", overflow: "visible" }}>
      <div className="container" style={{ padding: 0, overflow: "visible" }}>
        <div className="nav-category-scroll" style={{ display: "flex" }}>

          {/* All Catalog */}
          <Link
            href="/products"
            className="category-underline-link"
            style={{
              padding: "1rem 1.5rem",
              color: "#ffffff",
              fontWeight: !activeCategoryId ? 800 : 700,
              fontSize: "0.9rem",
              textDecoration: "none",
              borderRight: "1px solid rgba(255,255,255,0.15)",
              background: !activeCategoryId ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.1)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            All Catalog
          </Link>

          {categories.map((cat) => {
            const hasActiveChild = (c: SubCategory): boolean => {
              if (c.id === activeCategoryId) return true;
              if (c.children && c.children.length > 0) {
                return c.children.some(hasActiveChild);
              }
              return false;
            };
            const isActive = activeCategoryId === cat.id ||
              cat.children.some(hasActiveChild);
            const hasSubs = cat.children.length > 0;

            return (
              <div
                key={cat.id}
                className="nav-dropdown-parent"
                style={{ position: "relative", flexShrink: 0 }}
              >
                <Link
                  href={`/products?category=${cat.id}`}
                  className="nav-category-link category-underline-link"
                  style={{
                    padding: "1rem 1.25rem",
                    paddingRight: hasSubs ? "0.75rem" : "1.25rem",
                    color: "#ffffff",
                    fontWeight: isActive ? 800 : 600,
                    fontSize: "0.9rem",
                    textDecoration: "none",
                    borderRight: hasSubs ? "none" : "1px solid rgba(255,255,255,0.15)",
                    background: isActive ? "rgba(0,0,0,0.18)" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.2rem",
                    whiteSpace: "nowrap",
                    transition: "background 0.2s",
                  }}
                >
                  {cat.name}
                  {hasSubs && (
                    <ChevronDown size={14} style={{ opacity: 0.8, flexShrink: 0 }} />
                  )}
                </Link>

                {/* Dropdown for subcategories */}
                {hasSubs && (
                  <div
                    className="nav-dropdown-menu"
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      minWidth: "220px",
                      background: "#ffffff",
                      borderRadius: "0 0 10px 10px",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                      zIndex: 1000,
                      overflow: "hidden",
                      opacity: 0,
                      visibility: "hidden",
                      transform: "translateY(-6px)",
                      transition: "all 0.18s ease",
                      borderTop: "3px solid #229ac8",
                    }}
                  >
                    {/* Parent "All" link */}
                    <Link
                      href={`/products?category=${cat.id}`}
                      style={{
                        display: "block",
                        padding: "0.75rem 1.25rem",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        color: "#229ac8",
                        textDecoration: "none",
                        borderBottom: "1px solid #f1f5f9",
                        background: "#f8fafc",
                      }}
                    >
                      All {cat.name}
                    </Link>

                    {cat.children.map((sub) => {
                      const hasSubSubs = sub.children && sub.children.length > 0;
                      return (
                        <div key={sub.id} style={{ display: "flex", flexDirection: "column" }}>
                          <Link
                            href={`/products?category=${sub.id}`}
                            style={{
                              display: "block",
                              padding: "0.6rem 1.25rem 0.4rem 1.5rem",
                              fontSize: "0.85rem",
                              fontWeight: activeCategoryId === sub.id ? 700 : 600,
                              color: activeCategoryId === sub.id ? "#229ac8" : "#334155",
                              textDecoration: "none",
                              background: activeCategoryId === sub.id ? "#f0f9ff" : "transparent",
                              borderLeft: activeCategoryId === sub.id ? "3px solid #229ac8" : "3px solid transparent",
                              transition: "all 0.15s",
                            }}
                            className="nav-dropdown-item"
                          >
                            {sub.name}
                          </Link>
                          {hasSubSubs && (
                            <div style={{ display: "flex", flexDirection: "column", paddingLeft: "1.25rem", borderLeft: "1px solid #e2e8f0", marginLeft: "1.5rem", marginBottom: "0.4rem" }}>
                              {sub.children.map((subSub) => (
                                <Link
                                  key={subSub.id}
                                  href={`/products?category=${subSub.id}`}
                                  style={{
                                    display: "block",
                                    padding: "0.3rem 0.75rem",
                                    fontSize: "0.8rem",
                                    fontWeight: activeCategoryId === subSub.id ? 700 : 500,
                                    color: activeCategoryId === subSub.id ? "#229ac8" : "#64748b",
                                    textDecoration: "none",
                                    transition: "all 0.15s",
                                  }}
                                  className="nav-dropdown-item-l3"
                                >
                                  • {subSub.name}
                                </Link>
                              ))}
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
          
          {/* AI Book Finder Link */}
          <Link
            href="/recommendations"
            className="category-underline-link"
            style={{
              padding: "1rem 1.25rem",
              color: "#38bdf8",
              fontWeight: 800,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: "rgba(0,0,0,0.15)",
              marginLeft: "auto",
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              borderLeft: "1px solid rgba(255,255,255,0.15)"
            }}
          >
            ✨ AI Book Finder
          </Link>
          
          {/* Bulk Orders Link */}
          <Link
            href="/bulkorder"
            className="category-underline-link"
            style={{
              padding: "1rem 1.25rem",
              color: "#fbbf24",
              fontWeight: 800,
              fontSize: "0.9rem",
              textDecoration: "none",
              background: "rgba(0,0,0,0.15)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              borderLeft: "1px solid rgba(255,255,255,0.15)"
            }}
          >
            📦 Bulk Orders
          </Link>
        </div>
      </div>

      <style>{`
        .nav-category-scroll {
          overflow-x: auto;
          flex-wrap: nowrap;
          width: 100%;
        }
        @media (min-width: 768px) {
          .nav-category-scroll {
            overflow: visible !important;
            flex-wrap: wrap !important;
          }
        }
        @media (max-width: 767px) {
          .nav-dropdown-menu {
            display: none !important;
          }
        }
        .nav-dropdown-parent:hover .nav-dropdown-menu,
        .nav-dropdown-parent:focus-within .nav-dropdown-menu {
          opacity: 1 !important;
          visibility: visible !important;
          transform: translateY(0) !important;
        }
        .nav-dropdown-parent:hover .nav-category-link,
        .nav-category-link:hover {
          background: rgba(0,0,0,0.15) !important;
        }
        .nav-dropdown-item:hover {
          background: #f0f9ff !important;
          color: #229ac8 !important;
          border-left-color: #229ac8 !important;
        }
      `}</style>
    </div>
  );
}
