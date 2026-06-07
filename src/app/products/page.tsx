import { Suspense } from 'react';
import { PackageSearch, ArrowRight } from 'lucide-react';
import prisma from '@/lib/prisma';
import { getCurrencySettings } from '@/app/actions';
import ProductsFilter from '@/components/ProductsFilter';
import Link from 'next/link';
import HomeBuyButton from '@/components/HomeBuyButton';
import { buildCategoryTree, getAllDescendantCategoryIds } from '@/lib/categories';
import ProductBadges from '@/components/ProductBadges';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;
  let title = 'Books & Stationery Catalog | Avenue Book Centre';
  let description = 'Browse our full catalog of premium books, textbooks, CBSE/ICSE guides, children\'s books, and fine stationery. Quality products at great prices.';

  if (category) {
    const cat = await prisma.category.findUnique({ where: { id: category } });
    if (cat) {
      title = `${cat.name} | Avenue Book Centre`;
      description = `Shop the latest ${cat.name} products, textbooks, and guides online at Avenue Book Centre. Fast shipping across India.`;
    }
  } else if (search) {
    title = `Search results for "${search}" | Avenue Book Centre`;
    description = `Find books, textbooks, and materials related to "${search}" at Avenue Book Centre.`;
  }

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.avenuebookcentre.com/products${category ? `?category=${category}` : ''}`
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://www.avenuebookcentre.com/products${category ? `?category=${category}` : ''}`,
      images: [{ url: 'https://www.avenuebookcentre.com/logo.png', width: 1200, height: 630, alt: 'Avenue Book Centre' }]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['https://www.avenuebookcentre.com/logo.png']
    }
  };
}

// ── Product list — runs on server with correct category scope ─────────────────
async function ProductList({
  categoryId,
  search,
}: {
  categoryId?: string;
  search?: string;
}) {
  const currency = await getCurrencySettings();

  // Build where clause — if a PARENT category is selected, include all its children too
  let whereClause: any = { status: 'ACTIVE' };

  if (categoryId) {
    // Recursively get all descendant category IDs (supports any depth)
    const allIds = await getAllDescendantCategoryIds(categoryId);
    whereClause.categoryId = { in: allIds };
  }

  if (search) {
    whereClause.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: { category: true },
    orderBy: { createdAt: 'desc' },
  });

  if (products.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '6rem 2rem',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <PackageSearch size={52} color="var(--text-muted)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          No products found
        </h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          Try adjusting your filters or search term.
        </p>
        <Link href="/products" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          View All Products
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {products.map((product) => (
        <div
          key={product.id}
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            transition: 'box-shadow 0.2s, transform 0.2s',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
          className="product-card-hover"
        >
          {/* Image */}
          <Link
            href={`/products/${product.id}`}
            style={{
              position: 'relative',
              width: '100%',
              height: '220px',
              background: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=70'}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.75rem' }}
              loading="lazy"
            />
            <ProductBadges product={product} />
          </Link>

          {/* Info */}
          <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
            <span
              style={{
                fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.05em', fontWeight: 600, marginBottom: '0.4rem',
              }}
            >
              {product.category?.name}
            </span>
            <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
              <h3
                style={{
                  fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)',
                  marginBottom: '0.75rem', lineHeight: 1.4,
                }}
                className="hover-brand-color"
              >
                {product.name}
              </h3>
            </Link>
            <div
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid var(--border-color)', paddingTop: '0.85rem',
                marginTop: 'auto'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {product.discountPrice !== null && product.discountPrice !== undefined && (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500 }}>
                      {currency.symbol}{product.price.toFixed(2)}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {currency.symbol}{product.discountPrice.toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                    {currency.symbol}{product.price.toFixed(2)}
                  </span>
                )}
              </div>
              <HomeBuyButton product={product as any} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const { category, search } = await searchParams;

  // Fetch all categories and build a recursive tree for the filter sidebar
  const flatCategories = await prisma.category.findMany();
  const allCategories = buildCategoryTree(flatCategories);

  // Find active category name for heading (trace path up to root)
  let activeCategoryName = 'All Products';
  if (category) {
    const activeCat = flatCategories.find((c) => c.id === category);
    if (activeCat) {
      const path: string[] = [activeCat.name];
      let curr = activeCat;
      while (curr.parentId) {
        const parent = flatCategories.find((c) => c.id === curr.parentId);
        if (parent) {
          path.unshift(parent.name);
          curr = parent;
        } else {
          break;
        }
      }
      activeCategoryName = path.join(' › ');
    }
  }

  const totalProducts = await prisma.product.count({ where: { status: 'ACTIVE' } });

  // Dynamic Breadcrumb Schema for search engine indexing
  const breadcrumbItems = [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: 'https://www.avenuebookcentre.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Catalog',
      item: 'https://www.avenuebookcentre.com/products',
    }
  ];

  if (category) {
    const activeCat = flatCategories.find((c) => c.id === category);
    if (activeCat) {
      const pathChain: typeof flatCategories = [activeCat];
      let curr = activeCat;
      while (curr.parentId) {
        const parent = flatCategories.find((c) => c.id === curr.parentId);
        if (parent) {
          pathChain.unshift(parent);
          curr = parent;
        } else {
          break;
        }
      }
      
      pathChain.forEach((catNode, idx) => {
        breadcrumbItems.push({
          '@type': 'ListItem',
          position: 3 + idx,
          name: catNode.name,
          item: `https://www.avenuebookcentre.com/products?category=${catNode.id}`,
        });
      });
    }
  }

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems,
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - 5rem)', paddingBottom: '6rem' }}>
      {/* Dynamic Breadcrumbs Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Page Header */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '3rem 0' }}>
        <div className="container">
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: '#ffffff' }}>
            {search ? `Search: "${search}"` : activeCategoryName}
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
            {totalProducts} products across {allCategories.length} categories
          </p>
        </div>
      </div>

      <div className="container" style={{ marginTop: '2.5rem' }}>
        <div className="catalog-layout-grid">

          {/* ── Sidebar Filter ────────────────────────────────────────────── */}
          <aside>
            <ProductsFilter
              categories={allCategories}
              activeCategoryId={category}
              activeSearch={search}
            />
          </aside>

          {/* ── Product Grid ──────────────────────────────────────────────── */}
          <main>
            <Suspense
              fallback={
                <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--text-muted)' }}>
                  <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#0ea5e9', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
                  Loading products...
                </div>
              }
            >
              <ProductList categoryId={category} search={search} />
            </Suspense>
          </main>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .product-card-hover:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
          transform: translateY(-3px) !important;
        }
      `}</style>
    </div>
  );
}
