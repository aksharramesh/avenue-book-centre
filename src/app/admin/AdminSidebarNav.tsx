"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Sliders, Boxes, ShoppingCart, BarChart3, FolderTree, Image as ImageIcon, Puzzle, Inbox } from 'lucide-react';
import { getCMSContent } from "@/app/actions";

export default function AdminSidebarNav() {
  const pathname = usePathname();
  const [menuOrder, setMenuOrder] = useState<string[]>(["dashboard", "reports", "customers", "settings", "extensions", "products", "categories", "orders", "bulk-orders", "images"]);

  // Fetch navigation order from DB
  useEffect(() => {
    getCMSContent("admin_sidebar_menu_order").then((val) => {
      if (val) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMenuOrder(parsed);
          }
        } catch (e) {}
      }
    });
  }, [pathname]);

  // Scroll active menu item into view automatically
  useEffect(() => {
    const activeItem = document.querySelector('.admin-sidebar-menu-item-active');
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [pathname]);

  // Helper to determine if path is active
  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const linkStyle = (href: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.8rem 1rem',
    borderRadius: '0px',
    color: isActive(href) ? '#ffffff' : '#b4c2db',
    background: isActive(href) ? '#1e242a' : 'transparent',
    fontWeight: isActive(href) ? 700 : 500,
    borderLeft: isActive(href) ? '4px solid #1e91cf' : '4px solid transparent',
    transition: 'all 0.2s',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(0,0,0,0.1)'
  });

  const subLinkStyle = (href: string) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem 0.5rem 2.25rem',
    borderRadius: '0px',
    color: isActive(href) ? '#1e91cf' : '#b4c2db',
    background: isActive(href) ? '#1c2025' : 'transparent',
    fontWeight: isActive(href) ? 700 : 500,
    fontSize: '0.85rem',
    transition: 'all 0.2s',
    textDecoration: 'none'
  });

  // Check if any settings path is active to auto-expand
  const isSettingsActive = pathname.startsWith('/admin/settings') || 
                           pathname.startsWith('/admin/taxes') || 
                           pathname.startsWith('/admin/shipping') || 
                           pathname.startsWith('/admin/discounts') || 
                           pathname.startsWith('/admin/cms');

  const isExtensionsActive = pathname.startsWith('/admin/extensions');

  const renderMenuItem = (item: string) => {
    switch (item) {
      case "dashboard":
        return (
          <Link key="dashboard" href="/admin" style={linkStyle('/admin')} className={`admin-sidebar-menu-item ${isActive('/admin') ? "admin-sidebar-menu-item-active" : ""}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
        );
      case "reports":
        return (
          <Link key="reports" href="/admin/reports" style={linkStyle('/admin/reports')} className={`admin-sidebar-menu-item ${isActive('/admin/reports') ? "admin-sidebar-menu-item-active" : ""}`}>
            <BarChart3 size={20} /> Reports & Analytics
          </Link>
        );
      case "customers":
        return (
          <Link key="customers" href="/admin/customers" style={linkStyle('/admin/customers')} className={`admin-sidebar-menu-item ${isActive('/admin/customers') ? "admin-sidebar-menu-item-active" : ""}`}>
            <Users size={20} /> Customer Directory
          </Link>
        );
      case "settings":
        return (
          <div key="settings" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <input type="checkbox" id="settings-toggle" className="settings-toggle-checkbox" style={{ display: 'none' }} defaultChecked={isSettingsActive} />
            <label htmlFor="settings-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: isSettingsActive ? '#ffffff' : 'rgba(255,255,255,0.7)', background: isSettingsActive ? 'rgba(255,255,255,0.03)' : 'transparent', fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer', userSelect: 'none' }} className="admin-sidebar-menu-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Sliders size={20} color={isSettingsActive ? 'var(--brand-primary)' : 'currentColor'} />
                <span>Settings</span>
              </div>
              <span className="chevron-icon" style={{ display: 'inline-block' }}>▼</span>
            </label>
            <div className="settings-content" style={{ display: 'flex', flexDirection: 'column', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.75rem', gap: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/admin/settings/system" style={subLinkStyle('/admin/settings/system')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/system') ? "admin-sidebar-menu-item-active" : ""}`}>
                System Settings
              </Link>
              <Link href="/admin/settings/currency" style={subLinkStyle('/admin/settings/currency')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/currency') ? "admin-sidebar-menu-item-active" : ""}`}>
                Currency Manager
              </Link>
              <Link href="/admin/taxes" style={subLinkStyle('/admin/taxes')} className={`admin-sidebar-menu-item ${isActive('/admin/taxes') ? "admin-sidebar-menu-item-active" : ""}`}>
                Tax Manager
              </Link>
              <Link href="/admin/shipping" style={subLinkStyle('/admin/shipping')} className={`admin-sidebar-menu-item ${isActive('/admin/shipping') ? "admin-sidebar-menu-item-active" : ""}`}>
                Shipping Module
              </Link>
              <Link href="/admin/discounts" style={subLinkStyle('/admin/discounts')} className={`admin-sidebar-menu-item ${isActive('/admin/discounts') ? "admin-sidebar-menu-item-active" : ""}`}>
                Coupons & Discounts
              </Link>
              <Link href="/admin/settings/payment" style={subLinkStyle('/admin/settings/payment')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/payment') ? "admin-sidebar-menu-item-active" : ""}`}>
                Payment Settings
              </Link>
              <Link href="/admin/settings/navigation" style={subLinkStyle('/admin/settings/navigation')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/navigation') ? "admin-sidebar-menu-item-active" : ""}`}>
                Navigation Menu Order
              </Link>
              <Link href="/admin/settings/templates" style={subLinkStyle('/admin/settings/templates')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/templates') ? "admin-sidebar-menu-item-active" : ""}`}>
                Email & Templates
              </Link>
              <Link href="/admin/settings/smtp" style={subLinkStyle('/admin/settings/smtp')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/smtp') ? "admin-sidebar-menu-item-active" : ""}`}>
                SMTP Email Server
              </Link>
              <Link href="/admin/settings/tracking" style={subLinkStyle('/admin/settings/tracking')} className={`admin-sidebar-menu-item ${isActive('/admin/settings/tracking') ? "admin-sidebar-menu-item-active" : ""}`}>
                Tracking Modules
              </Link>
              <Link href="/admin/cms" style={subLinkStyle('/admin/cms')} className={`admin-sidebar-menu-item ${isActive('/admin/cms') ? "admin-sidebar-menu-item-active" : ""}`}>
                CMS Content Editor
              </Link>
            </div>
          </div>
        );
      case "extensions":
        return (
          <div key="extensions" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <input type="checkbox" id="extensions-toggle" className="settings-toggle-checkbox" style={{ display: 'none' }} defaultChecked={isExtensionsActive} />
            <label htmlFor="extensions-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', padding: '0.75rem', borderRadius: 'var(--radius-md)', color: isExtensionsActive ? '#ffffff' : 'rgba(255,255,255,0.7)', background: isExtensionsActive ? 'rgba(255,255,255,0.03)' : 'transparent', fontWeight: 500, transition: 'all 0.2s', cursor: 'pointer', userSelect: 'none' }} className="admin-sidebar-menu-item">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Puzzle size={20} color={isExtensionsActive ? 'var(--brand-primary)' : 'currentColor'} />
                <span>Extensions / Plugins</span>
              </div>
              <span className="chevron-icon" style={{ display: 'inline-block' }}>▼</span>
            </label>
            <div className="settings-content" style={{ display: 'flex', flexDirection: 'column', marginLeft: '1rem', borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '0.75rem', gap: '0.25rem', marginBottom: '0.5rem' }}>
              <Link href="/admin/extensions/installer" style={subLinkStyle('/admin/extensions/installer')} className={`admin-sidebar-menu-item ${isActive('/admin/extensions/installer') ? "admin-sidebar-menu-item-active" : ""}`}>
                Extension Installer
              </Link>
              <Link href="/admin/extensions/manager" style={subLinkStyle('/admin/extensions/manager')} className={`admin-sidebar-menu-item ${isActive('/admin/extensions/manager') ? "admin-sidebar-menu-item-active" : ""}`}>
                Extensions / Manager
              </Link>
              <Link href="/admin/extensions/modifications" style={subLinkStyle('/admin/extensions/modifications')} className={`admin-sidebar-menu-item ${isActive('/admin/extensions/modifications') ? "admin-sidebar-menu-item-active" : ""}`}>
                Modifications (OCMOD)
              </Link>
            </div>
          </div>
        );
      case "products":
        return (
          <Link key="products" href="/admin/products" style={linkStyle('/admin/products')} className={`admin-sidebar-menu-item ${isActive('/admin/products') ? "admin-sidebar-menu-item-active" : ""}`}>
            <Boxes size={20} /> Product Management
          </Link>
        );
      case "categories":
        return (
          <Link key="categories" href="/admin/categories" style={linkStyle('/admin/categories')} className={`admin-sidebar-menu-item ${isActive('/admin/categories') ? "admin-sidebar-menu-item-active" : ""}`}>
            <FolderTree size={20} /> Category Management
          </Link>
        );
      case "orders":
        return (
          <Link key="orders" href="/admin/orders" style={linkStyle('/admin/orders')} className={`admin-sidebar-menu-item ${isActive('/admin/orders') ? "admin-sidebar-menu-item-active" : ""}`}>
            <ShoppingCart size={20} /> Order Management
          </Link>
        );
      case "bulk-orders":
        return (
          <Link key="bulk-orders" href="/admin/bulk-orders" style={linkStyle('/admin/bulk-orders')} className={`admin-sidebar-menu-item ${isActive('/admin/bulk-orders') ? "admin-sidebar-menu-item-active" : ""}`}>
            <Inbox size={20} /> Bulk Orders
          </Link>
        );
      case "images":
        return (
          <Link key="images" href="/admin/images" style={linkStyle('/admin/images')} className={`admin-sidebar-menu-item ${isActive('/admin/images') ? "admin-sidebar-menu-item-active" : ""}`}>
            <ImageIcon size={20} /> Image Manager
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <nav style={{ padding: '1rem 0 0 0', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0px' }}>
      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4e5e7a', marginBottom: '0.5rem', padding: '0 1rem 0.5rem 1rem', fontWeight: 700 }}>
        Navigation Menu
      </div>
      
      {menuOrder.map(renderMenuItem)}
    </nav>
  );
}
