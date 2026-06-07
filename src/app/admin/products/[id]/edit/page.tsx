import prisma from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import styles from '../../../admin.module.css';
import { getCurrencySettings } from '@/app/actions';
import AIDescriptionGenerator from '@/components/AIDescriptionGenerator';

export const metadata = { title: 'Edit Product | Admin' };

interface ExtendedCategory {
  id: string;
  name: string;
  parentId: string | null;
}

function formatCategoryTree(
  categories: ExtendedCategory[],
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

  // Handle orphan nodes as fallback
  if (parentId === null && result.length < categories.length) {
    const matchedIds = new Set(result.map(r => r.id));
    const orphans = categories.filter(c => !matchedIds.has(c.id));
    for (const orphan of orphans) {
      result.push({
        id: orphan.id,
        name: orphan.name
      });
    }
  }

  return result;
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [product, categories, currency] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.category.findMany(),
    getCurrencySettings()
  ]);

  if (!product) {
    notFound();
  }

  const formattedCategories = formatCategoryTree(categories);

  async function updateProduct(formData: FormData) {
    'use server'
    
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const sku = formData.get('sku') as string;
    const price = parseFloat(formData.get('price') as string);
    const stock = parseInt(formData.get('stock') as string, 10);
    const categoryId = formData.get('categoryId') as string;
    const imageUrl = formData.get('imageUrl') as string;
    const status = formData.get('status') as string;
    const weight = parseFloat(formData.get('weight') as string);
    const fastDispatch = formData.get('fastDispatch') === 'true' || formData.get('fastDispatch') === 'on';
    const videoUrl = (formData.get('videoUrl') as string) || null;

    const publisher = (formData.get('publisher') as string) || null;
    const edition = (formData.get('edition') as string) || null;
    const editionDate = (formData.get('editionDate') as string) || null;
    const dimension = (formData.get('dimension') as string) || null;
    const isbn10 = (formData.get('isbn10') as string) || null;
    const isbn13 = (formData.get('isbn13') as string) || null;

    const discountPriceRaw = formData.get('discountPrice') as string;
    const discountPrice = discountPriceRaw ? parseFloat(discountPriceRaw) : null;
    const discountEndDateRaw = formData.get('discountEndDate') as string;
    const discountEndDate = discountEndDateRaw ? new Date(discountEndDateRaw) : null;

    await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        sku,
        price,
        discountPrice,
        discountEndDate,
        stock,
        categoryId,
        imageUrl: imageUrl || null,
        status,
        weight,
        publisher,
        edition,
        editionDate,
        dimension,
        isbn10,
        isbn13,
        fastDispatch,
        videoUrl,
      }
    });

    redirect('/admin/products?updated=true');
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Edit Product</h1>
        <div style={{display: 'flex', gap: '1rem'}}>
           <Link href="/admin/products" className="btn btn-outline" style={{ padding: '0.75rem 1.5rem' }}>
             Cancel
           </Link>
        </div>
      </div>

      <div className={styles.tableContainer} style={{ background: 'var(--bg-secondary)', padding: '2rem' }}>
        <form action={updateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* General Block */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend className="text-gold" style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', width: '100%', paddingBottom: '0.5rem' }}>General Information</legend>
            <div className="grid-cols-2">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Product Name *</label>
                <input type="text" name="name" className="input-base" required defaultValue={product.name} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Category *</label>
                <select name="categoryId" className="input-base" required defaultValue={product.categoryId}>
                  <option value="">Select Category...</option>
                  {formattedCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '0.5rem' }}>
                <label style={{ margin: 0 }}>Description *</label>
                <AIDescriptionGenerator />
              </div>
              <textarea name="description" className="input-base" rows={4} required defaultValue={product.description}></textarea>
            </div>
          </fieldset>

          {/* Data Block */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend className="text-gold" style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', width: '100%', paddingBottom: '0.5rem' }}>Data & Inventory</legend>
            <div className="grid-cols-3">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>SKU *</label>
                <input type="text" name="sku" className="input-base" required defaultValue={product.sku} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Price ({currency.symbol}) *</label>
                <input type="number" name="price" step="0.01" className="input-base" required defaultValue={product.price} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Quantity in Stock *</label>
                <input type="number" name="stock" className="input-base" required defaultValue={product.stock} />
              </div>
            </div>
            <div className="grid-cols-3" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Item Weight (kg) *</label>
                <input type="number" name="weight" step="0.01" className="input-base" required defaultValue={product.weight} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Discount Price ({currency.symbol})</label>
                <input type="number" name="discountPrice" step="0.01" className="input-base" placeholder="e.g. 19.99" defaultValue={product.discountPrice ?? ''} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Discount Expiry Date</label>
                <input type="date" name="discountEndDate" className="input-base" defaultValue={product.discountEndDate ? new Date(product.discountEndDate).toISOString().split('T')[0] : ''} />
              </div>
            </div>
          </fieldset>

          {/* Book Specifications Block */}
          <fieldset style={{ border: 'none', padding: 0 }}>
            <legend className="text-gold" style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', width: '100%', paddingBottom: '0.5rem' }}>Book Specifications (Optional)</legend>
            <div className="grid-cols-3">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Publisher</label>
                <input type="text" name="publisher" className="input-base" placeholder="e.g. O'Reilly Media" defaultValue={product.publisher ?? ''} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Edition</label>
                <input type="text" name="edition" className="input-base" placeholder="e.g. 2nd Edition" defaultValue={product.edition ?? ''} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Edition Date</label>
                <input type="text" name="editionDate" className="input-base" placeholder="e.g. October 2023" defaultValue={product.editionDate ?? ''} />
              </div>
            </div>
            <div className="grid-cols-3" style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Dimensions</label>
                <input type="text" name="dimension" className="input-base" placeholder="e.g. 7 x 0.6 x 9 inches" defaultValue={product.dimension ?? ''} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>ISBN-10</label>
                <input type="text" name="isbn10" className="input-base" placeholder="e.g. 1492056302" defaultValue={product.isbn10 ?? ''} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>ISBN-13</label>
                <input type="text" name="isbn13" className="input-base" placeholder="e.g. 978-1492056300" defaultValue={product.isbn13 ?? ''} />
              </div>
            </div>
          </fieldset>

           {/* Settings Block */}
           <fieldset style={{ border: 'none', padding: 0 }}>
             <legend className="text-gold" style={{ fontSize: '1.2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', width: '100%', paddingBottom: '0.5rem' }}>Status & Media</legend>
             <div className="grid-cols-2">
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label>Image URL</label>
                 <input type="url" name="imageUrl" className="input-base" placeholder="https://images.unsplash.com/..." defaultValue={product.imageUrl ?? ''} />
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                 <label>Status</label>
                 <select name="status" className="input-base" defaultValue={product.status}>
                   <option value="ACTIVE">Active</option>
                   <option value="DRAFT">Draft</option>
                   <option value="OUT_OF_STOCK">Out of Stock</option>
                 </select>
               </div>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', gridColumn: 'span 2', marginTop: '1rem' }}>
                 <label>Product Video URL (Optional)</label>
                 <input type="url" name="videoUrl" className="input-base" placeholder="e.g. https://www.youtube.com/watch?v=ScMzIvxBSi4" defaultValue={product.videoUrl ?? ''} />
                 <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Paste a YouTube video link, Vimeo URL, or direct video file link.</small>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', gridColumn: 'span 2' }}>
                 <input type="checkbox" name="fastDispatch" id="fastDispatch" defaultChecked={product.fastDispatch} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                 <label htmlFor="fastDispatch" style={{ fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>✈️ Enable Fast Dispatch (Storefront Badge)</label>
               </div>
             </div>
           </fieldset>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
             <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
               Update Product
             </button>
          </div>
        </form>
      </div>
    </div>
  );
}
