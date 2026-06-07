import Link from "next/link";
import { 
  ShieldCheck, 
  TrendingUp, 
  Handshake, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  Award, 
  Calendar,
  Layers,
  Star
} from "lucide-react";
import prisma from "@/lib/prisma";
import { getCMSContent, getCurrencySettings } from "@/app/actions";
import HomeBuyButton from "@/components/HomeBuyButton";
import ProductBadges from "@/components/ProductBadges";

export const metadata = {
  title: "Avenue Book Centre | Premium Books & Custom Stationery",
  description: "Avenue Book Centre provides premium novels, academic guides, custom notebooks, and curated journals for writers and avid readers.",
  alternates: {
    canonical: "https://www.avenuebookcentre.com"
  },
  openGraph: {
    title: "Avenue Book Centre | Premium Books & Custom Stationery",
    description: "Avenue Book Centre provides premium novels, academic guides, custom notebooks, and curated journals for writers and avid readers.",
    type: "website",
    url: "https://www.avenuebookcentre.com",
    images: [{ url: "https://www.avenuebookcentre.com/logo.png", width: 1200, height: 630, alt: "Avenue Book Centre" }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Avenue Book Centre | Premium Books & Custom Stationery",
    description: "Avenue Book Centre provides premium novels, academic guides, custom notebooks, and curated journals for writers and avid readers.",
    images: ["https://www.avenuebookcentre.com/logo.png"]
  }
};

export default async function Home() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });

  
  // 1. Curated Featured selections (3 items)
  const featuredProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 3,
    include: { category: true },
    orderBy: { price: "desc" }
  });

  // 2. Most Sold / Best Sellers (4 items)
  const mostSoldProducts = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 4,
    include: { category: true },
    orderBy: { stock: "asc" } // Use lower stock levels as a proxy for sales volume
  });

  // 3. New Releases (4 items)
  const newReleases = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    take: 4,
    include: { category: true },
    orderBy: { createdAt: "desc" }
  });

  const homeBannerAlert = await getCMSContent("home_banner_alert") || "Books & Custom Stationery";
  const homeHeroTitle = await getCMSContent("home_hero_title") || "Premium Novels, Guides & Custom Stationery";
  const homeHeroSubtext = await getCMSContent("home_hero_subtext") || "Avenue Book Centre provides premium novels, academic guides, custom notebooks, and curated reading stationery designed for writers and avid readers.";
  const currency = await getCurrencySettings();

  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Avenue Book Centre',
    url: 'https://www.avenuebookcentre.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.avenuebookcentre.com/products?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    }
  };

  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Avenue Book Centre',
    url: 'https://www.avenuebookcentre.com',
    logo: 'https://www.avenuebookcentre.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+91-98200-88220',
      contactType: 'customer service',
      email: 'support@avenuebookcentre.com'
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-primary)', overflow: 'hidden' }}>
      {/* WebSite & Organization structured data schemas */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />

      {/* 1. PREMIUM DYNAMIC HERO BANNER */}
      <section className="premium-hero-wrapper">
        <div className="container">
          <div className="hero-flex-layout">
            
            {/* Left Content Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}>
              <div className="glowing-alert-badge">
                <span>📚 {homeBannerAlert}</span>
              </div>
              <h1 className="glowing-hero-title">
                {homeHeroTitle}
              </h1>
              <p className="hero-description-text">
                {homeHeroSubtext}
              </p>
              <div className="hero-button-row">
                <Link href="/products" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                  Browse Collection <ArrowRight size={18} />
                </Link>
                <Link href="/recommendations" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)', textDecoration: 'none' }}>
                  AI Book Finder <Sparkles size={16} />
                </Link>
              </div>
            </div>

            {/* Right Deck Column */}
            <div className="book-deck-wrapper">
              <div className="isometric-deck">
                <div className="floating-book-item book-card-3">
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>CURRICULUM TEXTS</span>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', margin: '1rem 0' }}>CBSE / ICSE Syllabus Guides</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Avenue Book Centre</span>
                </div>
                <div className="floating-book-item book-card-2">
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>AI RECOMMENDATIONS</span>
                  <div style={{ fontWeight: 800, fontSize: '1.25rem', margin: '1rem 0' }}>Curated Books Companion</div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Explore options</span>
                </div>
                <div className="floating-book-item book-card-1">
                  <span style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.05em' }}>BEST SELLER</span>
                  <div style={{ fontWeight: 900, fontSize: '1.45rem', lineHeight: 1.25, margin: '1rem 0' }}>Designing Data-Intensive Applications</div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>by Martin Kleppmann</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      
      {/* 2. PREMIUM CATEGORIES GRID ROW */}
      {categories.length > 0 && (
        <section style={{ padding: '4rem 0', background: '#ffffff', borderBottom: '1px solid var(--border-color)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>Browse Directories</span>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0 0 0' }}>Curated Category Hubs</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
              {categories.map((cat) => (
                <Link href={`/products?category=${cat.id}`} key={cat.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1.5rem',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  textAlign: 'center',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease'
                }} className="table-row-hover">
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', marginBottom: '1rem' }}>
                    <BookOpen size={22} />
                  </div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block' }}>{cat.name}</strong>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. NEW RELEASES SECTION (Visual Ribbon, Specs preview) */}
      {newReleases.length > 0 && (
        <section style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
                  Just Arrived
                </span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0.25rem 0 0 0' }}>
                  New Releases
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
                  Discover the latest premium guides, materials, and textbooks freshly cataloged.
                </p>
              </div>
              <Link href="/products" className="text-brand" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                See All New <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
              {newReleases.map((product) => (
                <div key={product.id} className="card" style={{
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}>
                  <ProductBadges product={product} />

                  <Link href={`/products/${product.id}`} style={{ display: 'block', position: 'relative', width: '100%', height: '260px', background: 'var(--bg-tertiary)' }}>
                    <img
                      src={product.imageUrl || "/placeholder.jpg"}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.75rem' }}
                    />
                  </Link>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {product.category?.name || 'Category'}
                    </span>
                    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.3 }} className="hover-brand-color">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Small specifications snippet if available */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', marginTop: 'auto' }}>
                      <span style={{ fontSize: '0.7rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        ⚖️ {product.weight} kg
                      </span>
                      {product.publisher && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--bg-tertiary)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          🏢 {product.publisher.substring(0, 15)}
                        </span>
                      )}
                      {product.fastDispatch && (
                        <span style={{ fontSize: '0.7rem', background: 'var(--brand-glow)', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--brand-primary)', fontWeight: 700 }}>
                          ✈️ Fast Dispatch
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {product.discountPrice !== null && product.discountPrice !== undefined && (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
                              {currency.symbol}{product.price.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
                              {currency.symbol}{product.discountPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
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
          </div>
        </section>
      )}



      {/* 5. MOST SOLD / BEST SELLERS SECTION (Star Rating, Sold Ribbon) */}
      {mostSoldProducts.length > 0 && (
        <section style={{ padding: '6rem 0', background: 'var(--bg-primary)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
                  Best Sellers
                </span>
                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0.25rem 0 0 0' }}>
                  Most Sold Products
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
                  Our top-requested materials trusted by thousands of students and corporate teams.
                </p>
              </div>
              <Link href="/products" className="text-brand" style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                View Full Catalog <ArrowRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
              {mostSoldProducts.map((product) => (
                <div key={product.id} className="card" style={{
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#ffffff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                }}>
                  <ProductBadges product={product} />

                  <Link href={`/products/${product.id}`} style={{ display: 'block', position: 'relative', width: '100%', height: '260px', background: 'var(--bg-tertiary)' }}>
                    <img
                      src={product.imageUrl || "/placeholder.jpg"}
                      alt={product.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.75rem' }}
                    />
                  </Link>
                  <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                      {product.category?.name || 'Category'}
                    </span>
                    <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem', lineHeight: 1.3 }} className="hover-brand-color">
                        {product.name}
                      </h3>
                    </Link>
                    
                    {/* Star Rating Display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1rem', marginTop: 'auto' }}>
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} size={14} fill="#eab308" color="#eab308" />
                      ))}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, marginLeft: '0.25rem' }}>
                        (4.9/5)
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {product.discountPrice !== null && product.discountPrice !== undefined && (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) ? (
                          <>
                            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
                              {currency.symbol}{product.price.toFixed(2)}
                            </span>
                            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
                              {currency.symbol}{product.discountPrice.toFixed(2)}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
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
          </div>
        </section>
      )}

      {/* 6. CURATED FEATURED SELECTIONS SECTION */}
      {featuredProducts.length > 0 && (
        <section style={{ background: '#ffffff', padding: '6rem 0', borderTop: '1px solid var(--border-color)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
               <div>
                 <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>
                   Bestselling Books & Novelties
                 </span>
                 <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0.25rem 0 0 0' }}>
                   Premium Curated Selections
                 </h2>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.25rem' }}>
                   Explore our highest rated novels and beautifully crafted reading notebooks.
                 </p>
               </div>
               <Link href="/products" className="text-brand" style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 Explore Full Collection <ArrowRight size={18} />
               </Link>
            </div>
 
            <div className="grid-3-responsive" style={{ gap: '2rem' }}>
              {featuredProducts.map((product) => (
                <div key={product.id} className="card" style={{
                  padding: '0',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-xl)',
                  transition: 'all 0.3s ease',
                }}>
                    <Link href={`/products/${product.id}`} style={{ display: 'block', position: 'relative', width: '100%', height: '260px', background: 'var(--bg-tertiary)' }}>
                       <img
                         src={product.imageUrl || "/placeholder.jpg"}
                         alt={product.name}
                         style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.75rem' }}
                       />
                    </Link>
                   <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                     <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                       {product.category?.name || 'Category'}
                     </span>
                     <Link href={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                       <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.3 }} className="hover-brand-color">
                         {product.name}
                       </h3>
                     </Link>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
                         <div style={{ display: 'flex', flexDirection: 'column' }}>
                           {product.discountPrice !== null && product.discountPrice !== undefined && (!product.discountEndDate || new Date(product.discountEndDate) >= new Date()) ? (
                             <>
                               <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>
                                 {currency.symbol}{product.price.toFixed(2)}
                               </span>
                               <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-primary)' }}>
                                 {currency.symbol}{product.discountPrice.toFixed(2)}
                               </span>
                             </>
                           ) : (
                             <span style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>{currency.symbol}{product.price.toFixed(2)}</span>
                           )}
                         </div>
                         <HomeBuyButton product={product as any} />
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. TRUST & FEATURE HIGHLIGHTS */}
      <section style={{ padding: '6rem 0', background: '#ffffff', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brand-primary)', letterSpacing: '0.05em' }}>Art of Reading & Writing</span>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', margin: '0.25rem 0 1rem 0' }}>Why Readers & Writers Trust Us</h2>
            <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
              Every piece in our catalog is hand-selected to inspire your imagination, support your academic journey, or add luxury to your daily reflections.
            </p>
          </div>

          <div className="grid-3-responsive" style={{ gap: '2rem' }}>
            {[
              { icon: <ShieldCheck size={32} color="var(--brand-primary)" />, title: 'Premium Book Quality', desc: 'We source premium acid-free paper, durable library-grade bindings, and beautifully typeset editions.' },
              { icon: <TrendingUp size={32} color="var(--brand-primary)" />, title: 'Curated Selections', desc: 'From best-selling literature and academic textbooks to custom notebooks and creative writing journals.' },
              { icon: <Handshake size={32} color="var(--brand-primary)" />, title: 'Delivered with Care', desc: 'Every parcel is securely packed, weighed for accuracy, and shipped priority directly to your doorstep.' }
            ].map((feature, i) => (
               <div key={i} className="card" style={{ textAlign: 'center', padding: '3.5rem 2rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)' }}>
                 <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', border: '1px solid var(--border-color)' }}>
                   {feature.icon}
                 </div>
                 <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>{feature.title}</h3>
                 <p className="text-muted" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{feature.desc}</p>
               </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}
