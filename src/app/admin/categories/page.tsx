import prisma from "@/lib/prisma";
import { getCategoriesWithProductCount, createCategory, deleteCategory, updateCategoryNode } from "@/app/actions";
import { FolderHeart, Plus, Trash2, Info, Boxes, Edit2 } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Recursive helper for select dropdown tree indentation
interface TreeItem {
  id: string;
  name: string;
  parentId: string | null;
}

function formatCategoryTree(
  categories: TreeItem[],
  parentId: string | null = null,
  depth = 0
): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  const levelCategories = categories.filter(c => c.parentId === parentId);

  for (const c of levelCategories) {
    const prefix = "── ".repeat(depth);
    result.push({
      id: c.id,
      name: `${prefix}${c.name}`
    });
    const children = formatCategoryTree(categories, c.id, depth + 1);
    result.push(...children);
  }
  return result;
}

export default async function CategoryManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const resolvedParams = await searchParams;
  const editId = resolvedParams.edit;

  const categories = await getCategoriesWithProductCount();
  const treeSelectOptions = formatCategoryTree(categories as TreeItem[]);

  const editCategory = editId
    ? categories.find((c) => c.id === editId)
    : null;

  // Filter options: a category cannot be its own parent
  const filteredTreeSelectOptions = editCategory
    ? treeSelectOptions.filter((option) => option.id !== editCategory.id)
    : treeSelectOptions;

  // Unified Server Action to handle both create and update
  async function saveCategory(formData: FormData) {
    "use server";
    const categoryId = formData.get("categoryId") as string;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const imageUrl = formData.get("imageUrl") as string;
    const parentId = formData.get("parentId") as string;

    if (!name) return;

    if (categoryId) {
      await updateCategoryNode(categoryId, {
        name,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        parentId: parentId || null
      });
    } else {
      await createCategory({
        name,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        parentId: parentId || undefined
      });
    }

    redirect("/admin/categories?saved=true");
  }

  // Server action to delete category node
  async function removeCategory(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    if (id) {
      await deleteCategory(id);
    }
    redirect("/admin/categories?deleted=true");
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <span style={{ fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--brand-primary)", fontWeight: 700 }}>
            Catalog Administration
          </span>
          <h1 style={{ fontSize: "2.25rem", margin: "0.25rem 0 0 0", fontWeight: 800 }}>
            Category Management
          </h1>
        </div>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "2rem",
        alignItems: "start"
      }}>
        {/* Creation / Edit Card */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)"
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {editCategory ? (
              <>
                <Edit2 size={18} color="var(--brand-primary)" />
                Edit Category: {editCategory.name}
              </>
            ) : (
              <>
                <Plus size={18} color="var(--brand-primary)" />
                Create Category
              </>
            )}
          </h3>
          <p className="text-muted" style={{ fontSize: "0.85rem", marginBottom: "1.5rem" }}>
            {editCategory
              ? `Update details and configurations for category node "${editCategory.name}".`
              : "Add new category nodes to structure storefront filters and product directories."
            }
          </p>

          <form key={editCategory?.id || "create"} action={saveCategory} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <input type="hidden" name="categoryId" value={editCategory?.id || ""} />

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Category Name *</label>
              <input
                type="text"
                name="name"
                required
                defaultValue={editCategory?.name || ""}
                placeholder="e.g. Reference Guides"
                className="input-base"
                style={{ width: "100%", padding: "0.6rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Parent Category</label>
              <select
                name="parentId"
                className="input-base"
                defaultValue={editCategory?.parentId || ""}
                style={{ width: "100%", padding: "0.6rem", background: "#ffffff" }}
              >
                <option value="">None (Top-Level Category)</option>
                {filteredTreeSelectOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.25rem" }}>
                <Info size={12} />
                Establishing subcategories creates a clean tree hierarchy.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Description</label>
              <textarea
                name="description"
                defaultValue={editCategory?.description || ""}
                placeholder="Short summary of this product group..."
                className="input-base"
                rows={3}
                style={{ width: "100%", padding: "0.6rem" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 600 }}>Image URL</label>
              <input
                type="url"
                name="imageUrl"
                defaultValue={editCategory?.imageUrl || ""}
                placeholder="https://images.unsplash.com/..."
                className="input-base"
                style={{ width: "100%", padding: "0.6rem" }}
              />
            </div>

            {editCategory ? (
              <div style={{ display: "flex", gap: "1rem" }}>
                <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem", fontWeight: 700, flex: 1 }}>
                  Update Category
                </button>
                <Link
                  href="/admin/categories"
                  className="btn"
                  style={{
                    padding: "0.75rem",
                    fontWeight: 700,
                    flex: 1,
                    textAlign: "center",
                    border: "1px solid var(--border-color)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--bg-secondary)",
                    color: "var(--text-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  Cancel
                </Link>
              </div>
            ) : (
              <button type="submit" className="btn btn-primary" style={{ padding: "0.75rem", fontWeight: 700, width: "100%", marginTop: "0.5rem" }}>
                Save Category
              </button>
            )}
          </form>
        </div>

        {/* Directory Listing Table */}
        <div style={{
          background: "#ffffff",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-lg)",
          padding: "2rem",
          boxShadow: "0 4px 6px rgba(0,0,0,0.01)",
          flexGrow: 2
        }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FolderHeart size={18} color="var(--brand-primary)" />
            Category Directory
          </h3>

          {categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              No categories exist in the database. Use the creation panel to add one.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>Category</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem" }}>Parent Hierarchy</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", textAlign: "center" }}>Products Count</th>
                    <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", textTransform: "uppercase", fontSize: "0.75rem", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                          {cat.imageUrl ? (
                            <img src={cat.imageUrl} alt={cat.name} style={{ width: "32px", height: "32px", objectFit: "cover", borderRadius: "4px", border: "1px solid var(--border-color)" }} />
                          ) : (
                            <div style={{ width: "32px", height: "32px", background: "var(--bg-tertiary)", borderRadius: "4px" }} />
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{cat.name}</div>
                            {cat.description && (
                              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {cat.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "1rem" }}>
                        {cat.parent ? (
                          <span style={{
                            fontSize: "0.75rem",
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-color)",
                            padding: "0.25rem 0.5rem",
                            borderRadius: "var(--radius-sm)",
                            fontWeight: 600,
                            color: "var(--text-secondary)"
                          }}>
                            {cat.parent.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>
                            Top-Level Node
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "1rem", textAlign: "center" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.25rem 0.5rem",
                          background: cat._count.products > 0 ? "rgba(212, 175, 55, 0.08)" : "var(--bg-secondary)",
                          color: cat._count.products > 0 ? "var(--brand-primary)" : "var(--text-muted)",
                          borderRadius: "var(--radius-xl)",
                          fontWeight: 600,
                          fontSize: "0.75rem"
                        }}>
                          <Boxes size={12} />
                          {cat._count.products} products
                        </span>
                      </td>
                      <td style={{ padding: "1rem", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.5rem", alignItems: "center" }}>
                          <Link
                            href={`/admin/categories?edit=${cat.id}`}
                            style={{
                              color: "var(--brand-primary)",
                              cursor: "pointer",
                              padding: "0.4rem",
                              borderRadius: "4px",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                            title="Edit category"
                            aria-label={`Edit category ${cat.name}`}
                          >
                            <Edit2 size={16} />
                          </Link>
                          <form action={removeCategory} style={{ display: "inline" }}>
                            <input type="hidden" name="id" value={cat.id} />
                            <button
                              type="submit"
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "var(--danger)",
                                cursor: "pointer",
                                padding: "0.4rem",
                                borderRadius: "4px"
                              }}
                              title="Delete category"
                              aria-label={`Delete category ${cat.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
