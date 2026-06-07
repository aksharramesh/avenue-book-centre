import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with mock data...')

  // Clean up existing data
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()

  // Create Categories
  const cat1 = await prisma.category.create({
    data: {
      name: 'Pens & Notebooks',
      description: 'High-quality stationary for executives.',
      imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    },
  })

  const cat2 = await prisma.category.create({
    data: {
      name: 'Tech Accessories',
      description: 'Useful tech gifts for modern professionals.',
      imageUrl: 'https://images.unsplash.com/photo-1542491361-18f4bea02c11?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    },
  })

  const cat3 = await prisma.category.create({
    data: {
      name: 'Gift Hampers',
      description: 'Curated hampers for special occasions.',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
    },
  })

  // Create Products
  await prisma.product.createMany({
    data: [
      {
        name: 'Executive Leather Notebook',
        description: 'Premium leather-bound notebook with 200 pages of high-quality ivory paper.',
        price: 45.0,
        sku: 'NOTE-001',
        stock: 150,
        categoryId: cat1.id,
        imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
      {
        name: 'Gold-Trimmed Fountain Pen',
        description: 'Elegant fountain pen with 18k gold trim and a smooth writing experience.',
        price: 120.0,
        sku: 'PEN-001',
        stock: 50,
        categoryId: cat1.id,
        imageUrl: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
      {
        name: 'Wireless Charging Desk Pad',
        description: 'Large vegan leather desk pad with built-in fast wireless charging.',
        price: 85.0,
        sku: 'TECH-001',
        stock: 75,
        categoryId: cat2.id,
        imageUrl: 'https://images.unsplash.com/photo-1588644485573-00e9fe6aabdf?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
      {
        name: 'Noise-Canceling Earbuds',
        description: 'Premium wireless earbuds with active noise cancellation and 24h battery.',
        price: 199.0,
        sku: 'TECH-002',
        stock: 30,
        categoryId: cat2.id,
        imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
      {
        name: 'Luxury Onboarding Hamper',
        description: 'Includes a notebook, pen, mug, and gourmet coffee to welcome new executives.',
        price: 150.0,
        sku: 'HAMP-001',
        stock: 20,
        categoryId: cat3.id,
        imageUrl: 'https://images.unsplash.com/photo-1542841791-1925b02a2bf5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    ],
  })

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
