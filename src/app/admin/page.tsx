import prisma from '@/lib/prisma';
import Link from 'next/link';
import { Package, FolderTree, AlertTriangle, ShoppingCart, ChevronRight, Scale, Clock, Award } from 'lucide-react';
import { getCurrencySettings } from '@/app/actions';

export const metadata = {
  title: 'Dashboard | Avenue Book Centre Admin',
};

export default async function AdminDashboard() {
  const currency = await getCurrencySettings();

  // Load dynamic stock warning threshold from database settings
  const thresholdContent = await prisma.cMSContent.findUnique({
    where: { key: "config_stock_threshold" }
  });
  const threshold = thresholdContent ? parseInt(thresholdContent.value) || 10 : 10;

  // Calculate 15 days ago date threshold
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

  const [productCount, categoryCount, lowStockCount, recentOrders, recentProducts, lowStockProducts] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.product.count({ where: { stock: { lt: threshold } } }),
    prisma.order.findMany({
      where: {
        createdAt: {
          gte: fifteenDaysAgo
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    }),
    prisma.product.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { category: true }
    }),
    prisma.product.findMany({
      where: { stock: { lt: threshold } },
      take: 5,
      orderBy: { stock: 'asc' },
      include: { category: true }
    })
  ]);

  // Calculate total revenue from last 15 days orders
  const fifteenDaysRevenue = recentOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      
      {/* Dashboard Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Operations Dashboard</h1>
          <p className="text-muted" style={{ margin: 0 }}>Real-time business intelligence metrics, low stock indicators, and consumer checkouts.</p>
        </div>
        <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          System Online
        </div>
      </div>
      
      {/* KPI Stat Cards */}
      <div className="grid-4-responsive">
        
        {/* Total Products */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--brand-primary)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Total Catalog</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{productCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Items</span></div>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--brand-glow)', borderRadius: 'var(--radius-md)', color: 'var(--brand-primary)' }}>
              <Package size={24} />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--success)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Categories</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{categoryCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Hubs</span></div>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--success)' }}>
              <FolderTree size={24} />
            </div>
          </div>
        </div>

        {/* Low Stock alerts */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--danger)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Low Stock</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: lowStockCount > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{lowStockCount} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Alerts</span></div>
            </div>
            <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', color: 'var(--danger)' }}>
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>

        {/* Orders in last 15 days */}
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--brand-secondary)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Orders (Last 15d)</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{recentOrders.length} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-muted)' }}>Sales</span></div>
            </div>
            <div style={{ padding: '0.5rem', background: 'var(--brand-glow)', borderRadius: 'var(--radius-md)', color: 'var(--brand-secondary)' }}>
              <ShoppingCart size={24} />
            </div>
          </div>
        </div>

      </div>

      {/* Main Two Column Detail Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '2rem', alignItems: 'start' }} className="grid-2-responsive">
        
        {/* Left Side Column - Orders received in last 15 days */}
        <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#ffffff' }}>
          <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--brand-primary)" />
                Orders Received (Last 15 Days)
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Revenue: <strong>{currency.symbol}{fifteenDaysRevenue.toFixed(2)}</strong></span>
            </div>
            <Link href="/admin/orders" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
              Order Logs <ChevronRight size={16} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Receipt ID</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Customer</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Date</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Weight</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Total</th>
                  <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
                      <ShoppingCart size={32} style={{ margin: '0 auto 1rem auto', display: 'block', opacity: 0.5 }} />
                      No customer orders logged in the last 15 days.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order, idx) => (
                    <tr key={order.id} style={{ borderBottom: idx < recentOrders.length - 1 ? '1px solid var(--border-color)' : 'none', background: '#ffffff' }} className="table-row-hover">
                      <td style={{ padding: '1rem 1.5rem', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        #{order.id.substring(order.id.length - 8).toUpperCase()}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{order.customerName}</span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{order.customerEmail}</span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Scale size={12} /> {order.shippingWeight.toFixed(2)} kg
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {currency.symbol}{order.totalAmount.toFixed(2)}
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span className={`badge ${
                          order.status === 'COMPLETED' ? 'badge-success' : 
                          order.status === 'SHIPPED' ? 'badge-primary' : 
                          order.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Column - Stacked Inventory Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Low Stock Warnings Card */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <AlertTriangle size={20} color="var(--danger)" />
                Low Stock alerts
              </h2>
              <Link href="/admin/reports" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                Reports <ChevronRight size={16} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Product</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Price</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', textAlign: 'center' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                        ✨ Perfect! No products are under critical stock levels.
                      </td>
                    </tr>
                  ) : (
                    lowStockProducts.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: idx < lowStockProducts.length - 1 ? '1px solid var(--border-color)' : 'none', background: '#ffffff' }} className="table-row-hover">
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', padding: '2px' }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}></div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.4' }}>{p.name.substring(0, 18)}{p.name.length > 18 && '...'}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category.name}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          {currency.symbol}{p.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                          <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warning'}`} style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                            {p.stock === 0 ? 'OOS' : `${p.stock} units`}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Inventory Additions */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', background: '#ffffff' }}>
            <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
              <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Award size={20} color="var(--brand-primary)" />
                New Additions
              </h2>
              <Link href="/admin/products" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 700, color: 'var(--brand-primary)' }}>
                Full Catalog <ChevronRight size={16} />
              </Link>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Product</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Price</th>
                    <th style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProducts.length === 0 ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        No products cataloged in inventory.
                      </td>
                    </tr>
                  ) : (
                    recentProducts.map((p, idx) => (
                      <tr key={p.id} style={{ borderBottom: idx < recentProducts.length - 1 ? '1px solid var(--border-color)' : 'none', background: '#ffffff' }} className="table-row-hover">
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', padding: '2px' }} />
                            ) : (
                              <div style={{ width: '36px', height: '36px', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border-color)' }}></div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: '1.4' }}>{p.name.substring(0, 20)}{p.name.length > 20 && '...'}</span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.category.name}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                          {currency.symbol}{p.price.toFixed(2)}
                        </td>
                        <td style={{ padding: '1rem 1.5rem' }}>
                          <span className={`badge ${p.stock > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                            {p.stock} units
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
