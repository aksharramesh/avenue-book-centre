import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import ImportProductModule from "@/components/ImportProductModule";
import ProductTable from "./ProductTable";
import { getCurrencySettings } from "@/app/actions";

export const metadata = { title: "Products Catalog | Admin" };

export default async function AdminProducts() {
  const currency = await getCurrencySettings();
  const enableInlineEditingDb = await prisma.cMSContent.findUnique({ where: { key: "config_enable_inline_editing" } });
  const enableInlineEditing = enableInlineEditingDb ? enableInlineEditingDb.value === "true" : true;

  const enableWebImporterDb = await prisma.cMSContent.findUnique({ where: { key: "config_enable_web_importer" } });
  const enableWebImporter = enableWebImporterDb ? enableWebImporterDb.value === "true" : true;

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  // Serialize products for client component (convert Decimal/Date to plain types)
  const serializedProducts = products.map((p: any) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: Number(p.price),
    discountPrice: p.discountPrice !== null && p.discountPrice !== undefined ? Number(p.discountPrice) : null,
    discountEndDate: p.discountEndDate ? p.discountEndDate.toISOString() : null,
    stock: p.stock,
    status: p.status,
    imageUrl: p.imageUrl,
    category: { name: p.category.name },
  }));

  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" }
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", margin: 0, fontWeight: 700 }}>Product Management</h1>
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>Manage your catalog, pricing, stock levels, and product lifecycle.</p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link href="/admin/test" className="btn btn-outline" style={{ padding: "0.75rem 1.25rem", whiteSpace: "nowrap" }}>
            🛠️ Run Diagnostics
          </Link>
          <Link href="/admin/products/new" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", gap: "0.5rem", whiteSpace: "nowrap" }}>
            <Plus size={18} /> Add Product
          </Link>
        </div>
      </div>

      {/* Web URL Crawler Importer Module */}
      {enableWebImporter && (
        <ImportProductModule currencySymbol={currency.symbol} />
      )}

      {/* Product Table with Bulk Operations */}
      <ProductTable 
        products={serializedProducts} 
        categories={categories} 
        currencySymbol={currency.symbol} 
        enableInlineEditing={enableInlineEditing}
      />
    </div>
  );
}

