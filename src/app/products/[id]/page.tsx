import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, Box, Truck, ShieldCheck, Tag, Info } from 'lucide-react';
import prisma from '@/lib/prisma';
import ProductActions from '@/components/ProductActions';
import { getCurrencySettings } from '@/app/actions';

function getEmbedUrl(url: string | null) {
  if (!url) return null;
  // YouTube match
  const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  // Vimeo match
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)(?:$|\/|\?)/);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
  }
  return url;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true }
  });

  if (!product) return { title: 'Product Not Found | Avenue Book Centre Operations' };

  const keywordList = [
    product.name,
    product.category?.name || "Books",
    product.publisher || "",
    product.sku,
    "Avenue Book Centre",
    "buy books online",
    "Mumbai bookstore",
    "curriculum syllabus guides"
  ].filter(Boolean);

  const cleanDescription = product.description.replace(/<\/?[^>]+(>|$)/g, "").substring(0, 160);

  return {
    title: `Buy ${product.name} Online | Avenue Book Centre`,
    description: `${cleanDescription}... Purchase original textbooks and supplies from Avenue Book Centre. Fast shipping across Mumbai and India.`,
    keywords: keywordList,
    alternates: {
      canonical: `https://www.avenuebookcentre.com/products/${product.id}`
    },
    openGraph: {
      title: `Buy ${product.name} Online | Avenue Book Centre`,
      description: cleanDescription,
      type: 'books.book',
      url: `https://www.avenuebookcentre.com/products/${product.id}`,
      images: product.imageUrl 
        ? [{ url: product.imageUrl, alt: product.name }] 
        : [{ url: 'https://www.avenuebookcentre.com/logo.png', alt: 'Avenue Book Centre' }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `Buy ${product.name} Online | Avenue Book Centre`,
      description: `${cleanDescription}... Purchase original textbooks and supplies from Avenue Book Centre.`,
      images: [product.imageUrl || 'https://www.avenuebookcentre.com/logo.png']
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    }
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    notFound();
  }

  const currency = await getCurrencySettings();

  const embedUrl = getEmbedUrl(product.videoUrl);
  const isDirectVideo = product.videoUrl && (
    product.videoUrl.endsWith('.mp4') || 
    product.videoUrl.endsWith('.webm') || 
    product.videoUrl.endsWith('.ogg') ||
    product.videoUrl.includes('/video/upload/') ||
    product.videoUrl.includes('.mp4?')
  );

  // Dynamic Book Telemetry Calculations
  const wordCount = product.description.split(/\s+/).filter(Boolean).length || 50;
  const descriptionLength = product.description.length;
  
  // Calculate average reading speed & page counts
  const estReadingTimeHrs = Math.max(1, Math.ceil(wordCount * 0.12)); 
  const estPageCount = product.isbn10 
    ? Math.min(650, Math.max(120, parseInt(product.isbn10.substring(2, 5)) || 280)) 
    : Math.min(520, Math.max(160, (descriptionLength % 340) + 180));
    
  const categoryNameLower = product.category.name.toLowerCase();
  let skillLevel = "General Audience";
  let targetAudience = "Avid Readers & Collectors";
  
  if (categoryNameLower.includes("guide") || categoryNameLower.includes("textbook")) {
    skillLevel = "Intermediate / Advanced";
    targetAudience = "Students & Educators";
  } else if (categoryNameLower.includes("corporate") || categoryNameLower.includes("supplies")) {
    skillLevel = "Operations Procurement";
    targetAudience = "Logistics & Corporate Teams";
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: product.name,
    image: product.imageUrl || 'https://www.avenuebookcentre.com/logo.png',
    description: product.description.replace(/<\/?[^>]+(>|$)/g, ""),
    isbn: product.isbn13 || product.isbn10 || undefined,
    bookFormat: product.category?.name?.toLowerCase().includes("stationery") ? "https://schema.org/Notebook" : "https://schema.org/Paperback",
    publisher: product.publisher || "Avenue Book Centre",
    offers: {
      '@type': 'Offer',
      price: (product.discountPrice !== null && product.discountPrice !== undefined && (!product.discountEndDate || new Date(product.discountEndDate) >= new Date())) ? product.discountPrice : product.price,
      priceCurrency: currency.code,
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://www.avenuebookcentre.com/products/${product.id}`,
      priceValidUntil: product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : '2030-12-31',
      seller: {
        '@type': 'Organization',
        name: 'Avenue Book Centre'
      }
    }
  };

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: 'calc(100vh - 5rem)', paddingBottom: '6rem' }}>
      {/* JSON-LD Structured Data Schema for Google Crawlers */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb Area */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '1.5rem 0' }}>
        <div className="container">
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.875rem' }}>
            <ChevronLeft size={16} /> Back to Catalog
          </Link>
        </div>
      </div>
      
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="product-detail-grid">
          
          {/* Gallery & Video Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#ffffff', borderRadius: 'var(--radius-xl)' }}>
               <div className="product-gallery-wrapper">
                   <img
                     src={product.imageUrl || '/placeholder.jpg'}
                     alt={product.name}
                     style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '1.5rem' }}
                   />
               </div>
            </div>

            {product.videoUrl && (
              <div className="card" style={{ padding: '1.25rem', background: '#ffffff', borderRadius: 'var(--radius-xl)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎥 Product Video Preview
                </h3>
                <div className="responsive-video-container">
                  {isDirectVideo ? (
                    <video
                      src={product.videoUrl}
                      controls
                      preload="metadata"
                      style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-md)', background: '#000000' }}
                    />
                  ) : (
                    <iframe
                      src={embedUrl || ''}
                      title={`${product.name} Video Preview`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ border: 'none', width: '100%', height: '100%', borderRadius: 'var(--radius-md)' }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Product Info Section */}
          <div style={{ padding: '1rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--brand-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                  {product.category.name}
                </span>
                {product.stock === 0 ? (
                  <span className="badge badge-danger">Out of Stock</span>
                ) : (
                  <span className="badge badge-success">In Stock ({product.stock} units)</span>
                )}
              </div>
              
              <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.1, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
                {product.name}
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {product.discountPrice !== null && product.discountPrice !== undefined && (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) ? (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>
                      {currency.symbol}{product.discountPrice.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '1.5rem', textDecoration: 'line-through', color: 'var(--text-muted)', fontWeight: 500 }}>
                      {currency.symbol}{product.price.toFixed(2)}
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ unit</span>
                  </div>
                ) : (
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    {currency.symbol}{product.price.toFixed(2)}
                    <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ unit</span>
                  </div>
                )}
                {product.discountPrice !== null && product.discountPrice !== undefined && product.discountEndDate && (
                  <div style={{ fontSize: '0.85rem', color: new Date(product.discountEndDate) < new Date() ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>
                    {new Date(product.discountEndDate) < new Date() ? '❌ Discount Expired: ' : '🔥 Discount Expires: '}
                    {new Date(product.discountEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }}></div>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {product.description}
            </p>

            <div className="checkout-form-grid-2" style={{ marginTop: '1rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <Tag size={20} className="text-brand" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>SKU</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.sku}</div>
                  </div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <Truck size={20} className="text-brand" />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Standard Shipping</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Weight-Based</div>
                  </div>
               </div>
            </div>

            {/* Book Details & Specifications */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.25rem' }}>
                <Info size={16} style={{ color: 'var(--brand-primary)' }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>Product Specifications</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.875rem' }}>
                {product.publisher && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Publisher</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{product.publisher}</strong>
                  </div>
                )}
                {product.edition && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Edition</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{product.edition}</strong>
                  </div>
                )}
                {product.editionDate && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Edition Date</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{product.editionDate}</strong>
                  </div>
                )}
                {product.dimension && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Dimensions</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{product.dimension}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Item Weight</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{product.weight} kg</strong>
                </div>
                {product.isbn10 && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ISBN-10</span>
                    <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{product.isbn10}</strong>
                  </div>
                )}
                {product.isbn13 && (
                  <div>
                    <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ISBN-13</span>
                    <strong style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{product.isbn13}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Fast Dispatch</span>
                  <strong style={{ color: product.fastDispatch ? 'var(--success)' : 'var(--text-secondary)' }}>
                    {product.fastDispatch ? '✈️ Available (Priority dispatch)' : '📦 Standard dispatch'}
                  </strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Estimated Reading</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>~{estReadingTimeHrs} hours</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Page Volume</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{estPageCount} pages</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Target Audience</span>
                  <strong style={{ color: 'var(--text-secondary)' }}>{targetAudience}</strong>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Cognitive Skill Level</span>
                  <strong style={{ color: 'var(--brand-primary)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 800 }}>{skillLevel}</strong>
                </div>
              </div>
            </div>

            <ProductActions product={product} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={20} className="text-brand" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Enterprise Quality Assurance</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Truck size={20} className="text-brand" />
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>India-Wide & Global Managed Shipping</span>
               </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
