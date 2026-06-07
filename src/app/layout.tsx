import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import Image from 'next/image';
import { Lock, ShieldCheck, CreditCard, Award, User, ShoppingCart, Search, Wrench } from 'lucide-react';
import { auth, signOut } from '@/auth';
import Script from 'next/script';
import { CartProvider } from '@/context/CartContext';
import { getCurrencySettings, getCMSContent } from '@/app/actions';
import prisma from '@/lib/prisma';
import NavbarCart from '@/components/NavbarCart';
import MiniCartDrawer from '@/components/MiniCartDrawer';
import CategoryNavbar from '@/components/CategoryNavbar';
import { buildCategoryTree } from '@/lib/categories';
import { headers } from 'next/headers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Avenue Book Centre | Premium Books & Stationery',
    template: '%s | Avenue Book Centre'
  },
  description: 'Avenue Book Centre provides premium novels, academic guides, custom notebooks, and curated journals for writers and avid readers.',
  keywords: 'novels, journals, textbooks, CBSE textbooks, ICSE textbooks, office supplies, custom notebooks, Avenue Book Centre',
  authors: [{ name: 'Avenue Book Centre' }],
  metadataBase: new URL('https://www.avenuebookcentre.com'),
  openGraph: {
    title: 'Avenue Book Centre | Premium Books & Stationery',
    description: 'Explore premium novels, academic guides, custom notebooks, and curated reading stationery designed for writers and avid readers.',
    type: 'website',
    locale: 'en_US',
    url: 'https://www.avenuebookcentre.com',
    images: [{ url: 'https://www.avenuebookcentre.com/logo.png', width: 1200, height: 630, alt: 'Avenue Book Centre' }]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avenue Book Centre | Premium Books & Stationery',
    description: 'Explore premium novels, academic guides, custom notebooks, and curated reading stationery designed for writers and avid readers.',
    images: ['https://www.avenuebookcentre.com/logo.png'],
  }
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const currency = await getCurrencySettings();
  const storeName = await getCMSContent("config_store_name") || "Avenue Book Centre";
  const storePhone = await getCMSContent("config_store_telephone") || "+91 9820088220";
  const storeEmail = await getCMSContent("config_store_email") || "support@avenuebookcentre.com";

  // Fetch tracking variables
  const gaActive = (await getCMSContent("config_google_analytics_active")) === "true";
  const gaId = (await getCMSContent("config_google_analytics_id")) || "";
  const gtmActive = (await getCMSContent("config_gtm_active")) === "true";
  const gtmId = (await getCMSContent("config_gtm_id")) || "";
  const fbActive = (await getCMSContent("config_facebook_pixel_active")) === "true";
  const fbId = (await getCMSContent("config_facebook_pixel_id")) || "";
  const customHeadScript = (await getCMSContent("config_custom_head_script")) || "";
  const customBodyScript = (await getCMSContent("config_custom_body_script")) || "";

  // Fetch all categories and build a recursive tree for multi-level navigation
  const allNavCategories = await prisma.category.findMany();
  const navCategories = buildCategoryTree(allNavCategories);

  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/admin-login');

  if (isAdminRoute) {
    return (
      <html lang="en" className={inter.variable}>
        <body className="antialiased" style={{ background: '#f8fafc', margin: 0 }}>
          <CartProvider>
            {children}
          </CartProvider>
        </body>
      </html>
    );
  }

  const maintenanceMode = (await getCMSContent("config_maintenance_mode")) === "true";

  if (maintenanceMode) {
    return (
      <html lang="en" className={inter.variable}>
        <body className="antialiased" style={{ 
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
          color: '#f8fafc', 
          margin: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '100vh',
          fontFamily: 'var(--font-inter), sans-serif'
        }}>
          <div style={{
            maxWidth: '540px',
            width: '90%',
            padding: '3rem 2rem',
            background: 'rgba(30, 41, 59, 0.7)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1.75rem'
          }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Image src="/logo.png" alt="Avenue Book Centre Logo" width={64} height={64} style={{ objectFit: 'contain' }} priority />
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', display: 'block', lineHeight: 1.2 }}>
                  Avenue Book Centre
                </span>
                <span style={{ fontSize: '0.75rem', color: '#0ea5e9', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  for passionate readers
                </span>
              </div>
            </div>

            {/* Graphic Wrench */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'rgba(14, 165, 233, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              margin: '0.5rem 0'
            }}>
              <Wrench size={36} color="#0ea5e9" />
            </div>

            {/* Info Message */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Scheduled Maintenance</h1>
              <p style={{ fontSize: '0.925rem', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
                We are currently undergoing scheduled system updates to improve your browsing experience. 
                Our website will be back online shortly. We appreciate your patience!
              </p>
            </div>

            {/* Contacts details */}
            <div style={{
              width: '100%',
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              fontSize: '0.825rem',
              textAlign: 'left',
              color: '#cbd5e1'
            }}>
              <div>📞 Phone support: <a href={`tel:${storePhone}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>{storePhone}</a></div>
              <div>✉️ Email Support: <a href={`mailto:${storeEmail}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: 600 }}>{storeEmail}</a></div>
            </div>

            {/* Staff access */}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
              Are you part of the team? <Link href="/admin-login" style={{ color: '#0ea5e9', textDecoration: 'underline', fontWeight: 600 }}>Authorized Staff Portal</Link>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased">
        {/* Custom Head Script Injection */}
        {customHeadScript && (
          <div dangerouslySetInnerHTML={{ __html: customHeadScript }} style={{ display: 'none' }} />
        )}
        {/* Google Analytics GA4 */}
        {gaActive && gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        )}

        {/* Google Tag Manager Container */}
        {gtmActive && gtmId && (
          <>
            <Script id="google-tag-manager" strategy="afterInteractive">
              {`
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                height="0"
                width="0"
                style={{ display: 'none', visibility: 'hidden' }}
              />
            </noscript>
          </>
        )}

        {/* Facebook/Meta Pixel */}
        {fbActive && fbId && (
          <>
            <Script id="facebook-pixel" strategy="afterInteractive">
              {`
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${fbId}');
                fbq('track', 'PageView');
              `}
            </Script>
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: 'none' }}
                src={`https://www.facebook.com/tr?id=${fbId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        <CartProvider>
          
          {/* 1. OPENCART TOP UTILITY HEADER BAR */}
          <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "0.5rem 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
            <div className="container top-utility-container">
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <span>📞 Call Support: <strong>{storePhone}</strong></span>
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <span>✉️ Email: <strong>{storeEmail}</strong></span>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", fontWeight: 600 }}>
                {session?.user ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span>Welcome, <strong>{session.user.name}</strong></span>
                    <span style={{ color: "var(--text-muted)" }}>|</span>
                    <Link href="/orders" className="nav-link-hover">My Orders</Link>
                    <span style={{ color: "var(--text-muted)" }}>|</span>
                    <form action={async () => {
                      "use server";
                      await signOut();
                    }} style={{ display: "inline" }}>
                      <button type="submit" style={{ background: "none", border: "none", color: "var(--danger)", fontSize: "0.75rem", cursor: "pointer", fontWeight: 700, padding: 0, minHeight: "auto" }}>
                        Sign Out
                      </button>
                    </form>
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="nav-link-hover">Sign In</Link>
                    <span style={{ color: "var(--text-muted)" }}>|</span>
                    <Link href="/register" className="nav-link-hover">Register</Link>
                  </>
                )}
                
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <Link href="/cart" className="nav-link-hover">Shopping Cart</Link>
                <span style={{ color: "var(--text-muted)" }}>|</span>
                <Link href="/checkout" className="nav-link-hover">Checkout</Link>
              </div>
            </div>
          </div>

          {/* 2. OPENCART MAIN HEADER BRAND & SEARCH BAR ROW */}
          <header style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "1.25rem 0" }}>
            <div className="container header-row-container">
              
              {/* Store Logo Brand */}
              <a href="/" className="header-logo-brand" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
                <Image src="/logo.png" alt="Avenue Book Centre Logo" width={52} height={52} style={{ objectFit: "contain", verticalAlign: "middle" }} priority />
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <span style={{ fontSize: "1.55rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                    Avenue Book Centre
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--brand-primary)", marginTop: "1px", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    for passionate readers
                  </span>
                </div>
              </a>

              {/* Main Search Bar (Standard OpenCart Search Module) */}
              <form action="/products" method="GET" className="header-search-form" style={{ display: "flex", alignItems: "center", background: "var(--bg-tertiary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "0.25rem 0.25rem 0.25rem 1rem" }}>
                <input 
                  type="text" 
                  name="search" 
                  placeholder="Search premium books, CBSE textbooks, stationery..." 
                  style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: "0.875rem", color: "var(--text-primary)" }}
                />
                <button type="submit" style={{ background: "var(--brand-primary)", color: "#ffffff", borderRadius: "var(--radius-sm)", padding: "0.5rem 1rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, minHeight: "auto", boxShadow: "0 2px 5px rgba(14,165,233,0.2)" }}>
                  Search
                </button>
              </form>

              {/* Redesigned OpenCart Cart Dropdown Button */}
              <div className="header-cart-widget">
                <NavbarCart />
              </div>

            </div>
          </header>

          {/* 3. OPENCART HORIZONTAL CATEGORIES STRIP — with subcategory dropdowns */}
          <CategoryNavbar categories={navCategories} />

          {/* Main Content */}
          <main style={{ minHeight: 'calc(100vh - 280px)' }}>
            {children}
          </main>

          {/* Global Mini-Cart Sliding Drawer Panel */}
          <MiniCartDrawer />

          {/* 4. OPENCART FOOTER MATRIX & TRUST BADGES */}
          <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "4rem 0", marginTop: "auto", borderTop: "4px solid #1e293b" }}>
            <div className="container">
              
              {/* Footer Brand Logo */}
              <div style={{ marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1rem" }}>
                <Image src="/logo.png" alt="Avenue Book Centre" width={48} height={48} style={{ objectFit: "contain", filter: "brightness(0) invert(1) opacity(0.85)", verticalAlign: "middle" }} />
                <div>
                  <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.01em" }}>Avenue Book Centre</div>
                  <div style={{ color: "var(--brand-primary)", fontSize: "0.75rem", marginTop: "0.15rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>for passionate readers</div>
                </div>
              </div>

              {/* Four Column OpenCart Directory */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem", marginBottom: "3rem" }}>
                <div>
                  <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Information</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <Link href="/products" className="footer-link">About Us</Link>
                    <Link href="/products" className="footer-link">Delivery Information</Link>
                    <a href="#" className="footer-link">Privacy Policy</a>
                    <a href="#" className="footer-link">Terms & Conditions</a>
                  </div>
                </div>

                <div>
                  <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Customer Service</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <a href="#" className="footer-link">Contact Us</a>
                    <a href="#" className="footer-link">Returns</a>
                    <a href="#" className="footer-link">Site Map</a>
                  </div>
                </div>

                <div>
                  <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>Extras</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <Link href="/products" className="footer-link">Specials</Link>
                    <Link href="/products" className="footer-link">Brands</Link>
                    <Link href="/bulkorder" className="footer-link" style={{ color: "#fbbf24", fontWeight: "bold" }}>Bulk Orders</Link>
                    <Link href="/recommendations" className="footer-link" style={{ color: "#38bdf8", fontWeight: "bold" }}>AI Book Finder</Link>
                    <a href="#" className="footer-link">Gift Certificates</a>
                    <a href="#" className="footer-link">Affiliates</a>
                  </div>
                </div>

                <div>
                  <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 700, marginBottom: "1.25rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>My Account</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", fontSize: "0.85rem" }}>
                    <Link href="/orders" className="footer-link">Order History</Link>
                    <Link href="/cart" className="footer-link">Wish List</Link>
                    <Link href="/orders" className="footer-link">Newsletter</Link>
                    <a href="/admin-login" className="footer-link" style={{ color: "var(--brand-primary)", fontWeight: "bold" }}>Admin Login</a>
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2.5rem' }}></div>

              {/* McAfee & Security Trust Badges */}
              <div style={{ display: 'flex', gap: '1.5rem 3rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <ShieldCheck size={28} color="#10b981" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>McAfee SECURE</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Tested Daily</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Lock size={28} color="#3b82f6" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>SSL Encrypted</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>256-bit Security</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CreditCard size={28} color="#f59e0b" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>Safe Checkout</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Visa, MasterCard, UPI</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={28} color="#8b5cf6" />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>100% Authentic</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Original Publishers</div>
                  </div>
                </div>
              </div>

              <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '2.5rem' }}></div>
              
              <div style={{ fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', color: '#64748b' }}>
                <div>&copy; {new Date().getFullYear()} {storeName}. All rights reserved. <span style={{ color: '#475569' }}>Powered by Avenue Book Centre</span></div>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a>
                  <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a>
                </div>
              </div>
            </div>
          </footer>

        </CartProvider>

        {/* Custom Footer Script Injection */}
        {customBodyScript && (
          <div dangerouslySetInnerHTML={{ __html: customBodyScript }} style={{ display: 'none' }} />
        )}
      </body>
    </html>
  );
}
