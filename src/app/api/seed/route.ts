import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    console.log('Clearing old data and seeding database with Avenue Book Centre data...')
    
    // Clear existing data to allow re-seeding
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.discount.deleteMany();
    await prisma.cMSContent.deleteMany();

    // Create Categories
    const cat1 = await prisma.category.create({
      data: {
        name: 'CBSE Guides',
        description: 'Comprehensive guides, question banks, and notes for CBSE students.',
        imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    })

    const cat2 = await prisma.category.create({
      data: {
        name: 'ICSE Guides',
        description: 'Detailed study material and question banks for ICSE board.',
        imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    })

    const cat3 = await prisma.category.create({
      data: {
        name: 'Language & General Guides',
        description: 'Language learning books and general reference guides.',
        imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    })

    const cat4 = await prisma.category.create({
      data: {
        name: 'CBSE Textbooks',
        description: 'Official NCERT and CBSE textbooks for all classes.',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    })

    const cat5 = await prisma.category.create({
      data: {
        name: 'ICSE Textbooks',
        description: 'Official textbooks prescribed for ICSE curriculum.',
        imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    })

    const cat6 = await prisma.category.create({
      data: {
        name: 'Corporate Stationary',
        description: 'Premium notebooks, pens, and enterprise office supplies.',
        imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
      },
    })

    // Create Products with weights (in kg)
    await prisma.product.createMany({
      data: [
        {
          name: 'Oswaal CBSE Class 10 Question Bank 2025-26',
          description: 'Latest 2025-26 edition chapter-wise question bank with PYQs and Competency-Focused Questions for Class 10 Science.',
          price: 22.5,
          sku: 'OSW-CBSE-10-SCI',
          stock: 120,
          weight: 0.85,
          categoryId: cat1.id,
          imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'Golden Guide CBSE Class 12 Mathematics',
          description: 'Comprehensive 2025 Edition Golden Guide with chapter summaries and objective questions.',
          price: 24.0,
          sku: 'GLD-CBSE-12-MATH',
          stock: 65,
          weight: 1.2,
          categoryId: cat1.id,
          imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'Oswaal ICSE Class 10 Physics Guide 2025-26',
          description: 'Latest ICSE Question Bank and Guide for Class 10 Physics.',
          price: 25.0,
          sku: 'OSW-ICSE-10-PHY',
          stock: 90,
          weight: 0.8,
          categoryId: cat2.id,
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'English Grammar & Composition Guide',
          description: 'General reference guide for middle and high school English grammar.',
          price: 18.5,
          sku: 'GEN-ENG-GRAM',
          stock: 150,
          weight: 0.45,
          categoryId: cat3.id,
          imageUrl: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'Class 10 Science NCERT Textbook',
          description: 'Official CBSE Science textbook for Class 10.',
          price: 15.0,
          sku: 'CBSE-TXT-10-SCI',
          stock: 200,
          weight: 0.4,
          categoryId: cat4.id,
          imageUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'Class 12 Physics NCERT Textbook',
          description: 'Official CBSE Physics textbook Part 1 & 2 for Class 12.',
          price: 18.0,
          sku: 'CBSE-TXT-12-PHY',
          stock: 150,
          weight: 0.6,
          categoryId: cat4.id,
          imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'ICSE Class 9 Biology Textbook',
          description: 'Official Selina publisher textbook for ICSE Biology.',
          price: 17.5,
          sku: 'ICSE-TXT-9-BIO',
          stock: 110,
          weight: 0.5,
          categoryId: cat5.id,
          imageUrl: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
        {
          name: 'Premium Leather Bound Notebook',
          description: 'High-quality 200-page ruled notebook for corporate professionals.',
          price: 25.0,
          sku: 'CORP-STAT-NOTEBOOK-1',
          stock: 300,
          weight: 0.3,
          categoryId: cat6.id,
          imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60',
        },
      ],
    })

    // Create Marketing & Discount Coupons
    await prisma.discount.createMany({
      data: [
        {
          code: 'WELCOME10',
          type: 'PERCENT',
          value: 10.0,
          minWeight: 0.0,
          expiresAt: new Date('2028-12-31T23:59:59Z')
        },
        {
          code: 'FLAT15',
          type: 'FLAT',
          value: 15.0,
          minWeight: 0.0,
          expiresAt: new Date('2028-12-31T23:59:59Z')
        },
        {
          code: 'FREEHEAVY',
          type: 'PERCENT', // Represents free delivery if weight threshold is cleared
          value: 0.0,
          minWeight: 3.0,
          expiresAt: new Date('2028-12-31T23:59:59Z')
        }
      ]
    })

    // Seed default CMS content variables
    await prisma.cMSContent.createMany({
      data: [
        {
          key: 'home_hero_title',
          value: 'Elevating Corporate Operations & Gifting',
          description: 'Heading banner displayed on the homepage Hero section'
        },
        {
          key: 'home_hero_subtext',
          value: 'Avenue Book Centre provides enterprise-grade supplies, premium stationary, and curated corporate gifts that build trust and drive excellence across your organization.',
          description: 'Paragraph subheading displayed in homepage Hero section'
        },
        {
          key: 'home_banner_alert',
          value: 'Books & Corporate Stationery',
          description: 'Small rounded announcement tag above Hero title'
        }
      ]
    })

    return NextResponse.json({ message: 'Seeded B2C Avenue Book Centre database (including Product Weights, Discounts, and CMS configurations) successfully!' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to seed database: ' + (error as Error).message }, { status: 500 })
  }
}
