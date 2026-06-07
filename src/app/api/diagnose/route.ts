import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import * as actions from '@/app/actions';

export const dynamic = 'force-dynamic';

export async function POST() {
  const logs: string[] = [];
  
  const addLog = (msg: string) => {
    logs.push(msg);
  };

  addLog("Server-side test runner activated.");

  const sections: { title: string; tests: { name: string; passed: boolean; message: string }[] }[] = [];

  try {
    // ----------------------------------------------------
    // Section 1: Database Baseline Checks
    // ----------------------------------------------------
    const dbSection = { title: "Database Baseline Checks", tests: [] as any[] };
    
    // Check Category Seed
    const defaultCategory = await prisma.category.findFirst();
    if (defaultCategory) {
      dbSection.tests.push({
        name: "Check Default Category",
        passed: true,
        message: `Found seed category "${defaultCategory.name}".`
      });
      addLog(`✅ Category validation: found "${defaultCategory.name}".`);
    } else {
      dbSection.tests.push({
        name: "Check Default Category",
        passed: false,
        message: "No category found in the database. Ensure database seeds have run."
      });
      addLog("❌ Category validation: no records found!");
    }

    // Check Admin Seed
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser) {
      dbSection.tests.push({
        name: "Check Seed Admins",
        passed: true,
        message: `Seed administrator "${adminUser.name}" (${adminUser.email}) is active.`
      });
      addLog(`✅ Admin validation: seed user "${adminUser.email}" is loaded.`);
    } else {
      dbSection.tests.push({
        name: "Check Seed Admins",
        passed: false,
        message: "No seed admins detected in database."
      });
      addLog("❌ Admin validation failed!");
    }

    sections.push(dbSection);

    if (!defaultCategory) {
      return NextResponse.json({
        error: "Cannot run full E2E suite because database baseline categories are missing.",
        sections,
        logs
      });
    }

    const catId = defaultCategory.id;

    // ----------------------------------------------------
    // Section 2: Product Lifecycle (Single Items)
    // ----------------------------------------------------
    const productSection = { title: "Product Management (Single Items)", tests: [] as any[] };
    
    const newProductSku = `TEST-SKU-${Date.now()}`;
    addLog(`Creating product with SKU: ${newProductSku}...`);
    
    const newProduct = await prisma.product.create({
      data: {
        name: "Automation Test Book",
        description: "A book created for backend testing",
        price: 15.99,
        weight: 1.2,
        sku: newProductSku,
        stock: 45,
        status: "ACTIVE",
        categoryId: catId
      }
    });

    if (newProduct && newProduct.id) {
      productSection.tests.push({
        name: "Create Product Node",
        passed: true,
        message: `Successfully created test product ID: ${newProduct.id}`
      });
      addLog("✅ Product successfully logged to SQLite.");
    } else {
      productSection.tests.push({
        name: "Create Product Node",
        passed: false,
        message: "Product record was not returned or saved."
      });
      addLog("❌ Product node creation failed!");
    }

    // Duplicate product check
    addLog("Duplicating product node...");
    const dupResult = await actions.duplicateProduct(newProduct.id);
    if (dupResult.success && dupResult.product) {
      productSection.tests.push({
        name: "Duplicate Product Node",
        passed: true,
        message: `Successfully duplicated to new DRAFT product: "${dupResult.product.name}"`
      });
      addLog(`✅ Duplicate product check: duplicated SKU is ${dupResult.product.sku}`);
    } else {
      productSection.tests.push({
        name: "Duplicate Product Node",
        passed: false,
        message: dupResult.error || "Duplication failed."
      });
      addLog("❌ Duplication check failed!");
    }

    // Update product check
    addLog("Updating product weights & stock...");
    const updatedProduct = await prisma.product.update({
      where: { id: newProduct.id },
      data: {
        name: "Updated Automation Test Book",
        price: 19.99,
        stock: 50,
        weight: 1.5
      }
    });

    if (updatedProduct.price === 19.99 && updatedProduct.stock === 50) {
      productSection.tests.push({
        name: "Update/Edit Product Node",
        passed: true,
        message: `Price successfully updated to $19.99 and stock set to 50.`
      });
      addLog("✅ Product node attributes updated successfully.");
    } else {
      productSection.tests.push({
        name: "Update/Edit Product Node",
        passed: false,
        message: "Updated attributes did not persist correctly."
      });
      addLog("❌ Product edit update attributes failed!");
    }

    sections.push(productSection);

    // ----------------------------------------------------
    // Section 3: Bulk Management Operations
    // ----------------------------------------------------
    const bulkSection = { title: "Bulk Management Operations", tests: [] as any[] };
    addLog("Seeding 3 bulk-dummy records...");
    
    const dummy1 = await prisma.product.create({
      data: { name: "Dummy Product A", description: "Desc", price: 10.0, sku: `DUMMY-A-${Date.now()}`, stock: 10, categoryId: catId, status: "ACTIVE" }
    });
    const dummy2 = await prisma.product.create({
      data: { name: "Dummy Product B", description: "Desc", price: 20.0, sku: `DUMMY-B-${Date.now()}`, stock: 20, categoryId: catId, status: "ACTIVE" }
    });
    const dummy3 = await prisma.product.create({
      data: { name: "Dummy Product C", description: "Desc", price: 30.0, sku: `DUMMY-C-${Date.now()}`, stock: 30, categoryId: catId, status: "ACTIVE" }
    });

    const dummyIds = [dummy1.id, dummy2.id, dummy3.id];
    let testCat: any = null;

    // Status
    addLog("Testing bulk update status to DRAFT...");
    const bulkStatusRes = await actions.bulkUpdateProductStatus(dummyIds, "DRAFT");
    const checkStatusDraft = await prisma.product.findMany({ where: { id: { in: dummyIds } } });
    const allDraft = checkStatusDraft.every(p => p.status === "DRAFT");
    
    bulkSection.tests.push({
      name: "Bulk Status Modification (DRAFT)",
      passed: bulkStatusRes.success && allDraft,
      message: `Adjusted all ${checkStatusDraft.length} status attributes to DRAFT.`
    });
    addLog(allDraft ? "✅ Bulk status update passes." : "❌ Bulk status update fails.");

    // Price
    addLog("Testing bulk price adjustment (+10%)...");
    await actions.bulkUpdateProductPrice(dummyIds, "set", 25.0);
    const bulkPricePctRes = await actions.bulkUpdateProductPrice(dummyIds, "adjust_percent", 10.0);
    const checkPricePct = await prisma.product.findMany({ where: { id: { in: dummyIds } } });
    const priceCorrect = checkPricePct.every(p => p.price === 27.50);

    bulkSection.tests.push({
      name: "Bulk Price Adjustment (+10% increase)",
      passed: bulkPricePctRes.success && priceCorrect,
      message: `Prices successfully multiplied by 1.10. Verified value is $27.50.`
    });
    addLog(priceCorrect ? "✅ Bulk price multiplier math holds true." : "❌ Price multiplier failed!");

    // Stock
    addLog("Testing bulk stock adjustment (-15)...");
    await actions.bulkUpdateProductStock(dummyIds, "set", 100);
    const bulkStockAdjRes = await actions.bulkUpdateProductStock(dummyIds, "adjust", -15);
    const checkStockAdj = await prisma.product.findMany({ where: { id: { in: dummyIds } } });
    const stockCorrect = checkStockAdj.every(p => p.stock === 85);

    bulkSection.tests.push({
      name: "Bulk Stock Quantity Adjustment (-15 subtract)",
      passed: bulkStockAdjRes.success && stockCorrect,
      message: `Successfully subtracted 15 units. Verified quantity is 85.`
    });
    addLog(stockCorrect ? "✅ Bulk stock adjustments passes." : "❌ Bulk stock adjustments fails.");

    // Category Bulk Update Test
    addLog("Testing bulk category update...");
    testCat = await prisma.category.create({
      data: { name: "Bulk Target Category", description: "Desc" }
    });
    const bulkCatRes = await actions.bulkUpdateProductCategory(dummyIds, testCat.id);
    const checkCatAdj = await prisma.product.findMany({ where: { id: { in: dummyIds } } });
    const catCorrect = checkCatAdj.every(p => p.categoryId === testCat.id);

    bulkSection.tests.push({
      name: "Bulk Category Reassignment",
      passed: bulkCatRes.success && catCorrect,
      message: `Reassigned all 3 products to category "${testCat.name}".`
    });
    addLog(catCorrect ? "✅ Bulk category reassignment passes." : "❌ Bulk category reassignment fails.");

    // Fast Dispatch Bulk Update Test
    addLog("Testing bulk fast dispatch enable...");
    const bulkFastRes = await actions.bulkUpdateProductFastDispatch(dummyIds, true);
    const checkFastAdj = await prisma.product.findMany({ where: { id: { in: dummyIds } } });
    const fastCorrect = checkFastAdj.every(p => p.fastDispatch === true);

    bulkSection.tests.push({
      name: "Bulk Fast Dispatch Toggle",
      passed: bulkFastRes.success && fastCorrect,
      message: `Successfully enabled Fast Dispatch badge overlay for all 3 products.`
    });
    addLog(fastCorrect ? "✅ Bulk fast dispatch toggling passes." : "❌ Bulk fast dispatch toggling fails.");

    // Delete
    addLog("Testing bulk deletion...");
    const bulkDeleteRes = await actions.bulkDeleteProducts(dummyIds);
    const checkDeletedCount = await prisma.product.count({ where: { id: { in: dummyIds } } });
    
    bulkSection.tests.push({
      name: "Bulk Inventory Deletion",
      passed: bulkDeleteRes.success && checkDeletedCount === 0,
      message: `Cleanly removed all bulk items from inventory records.`
    });
    addLog(checkDeletedCount === 0 ? "✅ Bulk deletion passes." : "❌ Bulk deletion failed.");

    // Clean up temporary Category
    if (testCat) {
      await prisma.category.delete({ where: { id: testCat.id } });
      addLog("🧹 Diagnostics bulk target categories purged.");
    }

    sections.push(bulkSection);

    // ----------------------------------------------------
    // Section 4: Discount & Coupon Validation
    // ----------------------------------------------------
    const discountSection = { title: "Discount & Coupon Engine", tests: [] as any[] };
    
    const couponCode = `TESTPROMO-${Date.now()}`;
    addLog(`Creating discount code: ${couponCode}...`);

    const discountCreateRes = await actions.createDiscount({
      code: couponCode,
      type: "PERCENT",
      value: 15,
      minWeight: 1.0,
      expiresAt: "2028-12-31T23:59:59.000Z"
    });

    if (discountCreateRes.success && discountCreateRes.discount) {
      discountSection.tests.push({
        name: "Create Discount Campaign",
        passed: true,
        message: `Registered code "${couponCode}" at 15% discount.`
      });
      addLog("✅ Coupon registered successfully.");
    } else {
      discountSection.tests.push({
        name: "Create Discount Campaign",
        passed: false,
        message: "Failed to create discount record."
      });
      addLog("❌ Coupon registration failed!");
    }

    // Validate Coupon
    addLog("Validating discount coupon active status...");
    const validateRes = await actions.validateCoupon(couponCode);
    const couponValidated = validateRes.success && validateRes.discount && validateRes.discount.value === 15;
    
    discountSection.tests.push({
      name: "Validate Active Coupon",
      passed: couponValidated,
      message: couponValidated ? "Coupon validates successfully." : "Validation failed."
    });
    addLog(couponValidated ? "✅ Active validation passed." : "❌ Active validation failed.");

    // Toggle coupon
    if (discountCreateRes.discount) {
      addLog("Toggling coupon active status to false...");
      await actions.toggleDiscountActive(discountCreateRes.discount.id, false);
      const validateInactiveRes = await actions.validateCoupon(couponCode);
      const couponToggledOk = validateInactiveRes.error === "This promo code is no longer active.";

      discountSection.tests.push({
        name: "Toggle Active State Guards",
        passed: couponToggledOk,
        message: couponToggledOk ? "Properly rejects inactive coupon." : "Failed to guard inactive state."
      });
      addLog(couponToggledOk ? "✅ Inactive state guard works." : "❌ Inactive state guard broken.");

      // Restore coupon for checkout test
      await actions.toggleDiscountActive(discountCreateRes.discount.id, true);
    } else {
      discountSection.tests.push({
        name: "Toggle Active State Guards",
        passed: false,
        message: "Failed to run toggling check: coupon was not created."
      });
    }

    sections.push(discountSection);

    // ----------------------------------------------------
    // Section 5: Checkout Math & Calculations
    // ----------------------------------------------------
    const checkoutSection = { title: "B2C Checkout calculations & orders", tests: [] as any[] };
    
    addLog("Overriding CMS shipping/tax configurations for exact mathematical testing...");
    await actions.updateCMSContent("tax_rate", "10.0"); // 10%
    await actions.updateCMSContent("shipping_free_threshold", "100.0"); // $100
    await actions.updateCMSContent("shipping_base_cost", "5.0"); // $5.00
    await actions.updateCMSContent("shipping_base_weight", "1.0"); // 1kg
    await actions.updateCMSContent("shipping_additional_kg_cost", "2.0"); // $2.00/kg
    
    // Save original national rates and set test rates
    const originalIpsRatesDb = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_national" } });
    const originalIpsRatesStr = originalIpsRatesDb ? originalIpsRatesDb.value : "0.5:40.00,1:70.00,2:120.00";
    await actions.updateCMSContent("shipping_ips_rates_national", "0.5:5.00,1.0:7.00,5.0:13.00");

    const checkoutItems = [
      {
        productId: newProduct.id, // Price $19.99, Weight 1.5kg, Stock 50 units (updated)
        quantity: 3,
        price: 19.99
      }
    ];

    addLog("Simulating customer checkout order transaction...");
    const orderRes = await actions.createOrder({
      customerName: "Alice Tester",
      customerEmail: "alice@example.com",
      shippingAddress: "123 Test Lane, Automation City",
      couponCode: couponCode,
      items: checkoutItems,
      shippingMethod: "IPS",
      zipCode: "110001"
    });

    if (orderRes.success && orderRes.orderId) {
      checkoutSection.tests.push({
        name: "Create E2E Storefront Order",
        passed: true,
        message: `Order successfully generated. Transaction receipt ID: ${orderRes.orderId}`
      });
      addLog("✅ Order successfully completed transaction.");

      // Check math
      const checkOrder = await prisma.order.findUnique({
        where: { id: orderRes.orderId }
      });

      if (checkOrder) {
        const weightMatches = parseFloat(checkOrder.shippingWeight.toFixed(2)) === 4.50;
        const shippingMatches = parseFloat(checkOrder.shippingCost.toFixed(2)) === 13.00;
        const discountMatches = parseFloat((checkOrder.discountAmount || 0).toFixed(2)) === 9.00;
        const taxMatches = parseFloat(checkOrder.taxAmount.toFixed(2)) === 5.10;
        const totalMatches = parseFloat(checkOrder.totalAmount.toFixed(2)) === 69.07;

        checkoutSection.tests.push({
          name: "Verify Weight-Based Shipping Math",
          passed: shippingMatches && weightMatches,
          message: `Weight: ${checkOrder.shippingWeight}kg. Shipping Cost: $${checkOrder.shippingCost.toFixed(2)} (Expected $13.00)`
        });
        addLog(shippingMatches ? "✅ Shipping calculation holds." : "❌ Shipping calculation mismatch!");

        checkoutSection.tests.push({
          name: "Verify Promo Discount Math",
          passed: discountMatches,
          message: `Discount Subtraction: -$${(checkOrder.discountAmount || 0).toFixed(2)} (Expected -$9.00)`
        });
        addLog(discountMatches ? "✅ Discount calculation holds." : "❌ Discount calculation mismatch!");

        checkoutSection.tests.push({
          name: "Verify Sales Tax (10%) Math",
          passed: taxMatches,
          message: `Tax Collected: $${checkOrder.taxAmount.toFixed(2)} (Expected $5.10)`
        });
        addLog(taxMatches ? "✅ Tax calculation holds." : "❌ Tax calculation mismatch!");

        checkoutSection.tests.push({
          name: "Verify Invoice Grand Total",
          passed: totalMatches,
          message: `Grand Total: $${checkOrder.totalAmount.toFixed(2)} (Expected $69.07)`
        });
        addLog(totalMatches ? "✅ Grand total matches." : "❌ Grand total mismatch!");
      }
    } else {
      checkoutSection.tests.push({
        name: "Create E2E Storefront Order",
        passed: false,
        message: orderRes.error || "Order creation failed."
      });
      addLog("❌ Checkout E2E storefront order transaction failed!");
    }

    // Deleting referential integrity guard check
    addLog("Verifying integrity constraints: deleting product referenced in order...");
    const failDeleteRes = await actions.deleteProduct(newProduct.id);
    const integrityCheckPassed = failDeleteRes.error !== undefined && failDeleteRes.error.includes("Cannot delete");
    
    checkoutSection.tests.push({
      name: "Verify Referential Deletion Protection",
      passed: integrityCheckPassed,
      message: integrityCheckPassed ? "Cleanly prevented deletion of referenced product SKU." : "Failed to prevent product deletion."
    });
    addLog(integrityCheckPassed ? "✅ Referential integrity holds." : "❌ Product successfully deleted! Mismatch!");

    sections.push(checkoutSection);

    // ----------------------------------------------------
    // Cleanup Database Operations
    // ----------------------------------------------------
    addLog("Cleaning up generated diagnostics data...");
    
    if (orderRes.success && orderRes.orderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: orderRes.orderId } });
      await prisma.order.delete({ where: { id: orderRes.orderId } });
      addLog("🧹 Diagnostics orders & items purged.");
    }

    if (dupResult.success && dupResult.product) {
      await prisma.product.delete({ where: { id: dupResult.product.id } });
    }

    await prisma.product.delete({ where: { id: newProduct.id } });
    addLog("🧹 Diagnostics product nodes purged.");

    if (discountCreateRes.discount) {
      await prisma.discount.delete({ where: { id: discountCreateRes.discount.id } });
      addLog("🧹 Diagnostics campaign coupons purged.");
    }

    // Restore original shipping configurations
    await actions.updateCMSContent("shipping_ips_rates_national", originalIpsRatesStr);

    addLog("Diagnostics run complete.");

  } catch (e: any) {
    console.error(e);
    addLog(`❌ Diagnostics run halted: ${e.message}`);
    try {
      // Revert in case of failure as well
      const originalIpsRatesDb = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_national" } });
      const currentRatesVal = originalIpsRatesDb ? originalIpsRatesDb.value : "";
      if (currentRatesVal === "0.5:5.00,1.0:7.00,5.0:13.00") {
        await actions.updateCMSContent("shipping_ips_rates_national", "0.5:40.00,1:70.00,2:120.00");
      }
    } catch (_) {}
    return NextResponse.json({
      error: e.message || "An unexpected error occurred during diagnostics.",
      sections,
      logs
    }, { status: 500 });
  }

  return NextResponse.json({
    sections,
    logs
  });
}
