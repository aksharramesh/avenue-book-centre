"use server"

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { sendSimulatedEmail } from "@/lib/email"

const prisma = new PrismaClient()

function resolveShippingZone(zip: string): "LOCAL" | "STATE" | "NATIONAL" {
  const cleanZip = zip.trim().replace(/\s/g, "");
  if (!/^\d{6}$/.test(cleanZip)) return "NATIONAL";
  if (cleanZip.startsWith("400")) return "LOCAL";
  const prefix2 = cleanZip.substring(0, 2);
  const prefixNum = parseInt(prefix2, 10);
  if (prefixNum >= 40 && prefixNum <= 44) return "STATE";
  return "NATIONAL";
}

// Customer Account Registration
export async function registerUser(formData: FormData) {
  const name     = formData.get("name")       as string
  const email    = (formData.get("email")      as string).toLowerCase().trim()
  const password = formData.get("password")   as string
  const phoneCountry = formData.get("phoneCountryCode") as string
  const phoneLocal   = formData.get("phoneLocal") as string
  const phone        = phoneLocal ? `${phoneCountry} ${phoneLocal.trim()}` : null
  const fax          = (formData.get("fax")       as string) || null
  const address  = (formData.get("address")   as string) || null
  const city     = (formData.get("city")      as string) || null
  const state    = (formData.get("state")     as string) || null
  const postalCode = (formData.get("postalCode") as string) || null
  const country  = (formData.get("country")   as string) || null

  if (!name || !email || !password) {
    return { error: "Missing required fields" }
  }

  if (phoneLocal && phoneLocal.trim().replace(/\D/g, "").length !== 10) {
    return { error: "Phone number must be exactly 10 digits" }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: "User already exists with that email address" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  // Seed standard admin for first user, others customer
  const userCount = await prisma.user.count();
  const role = userCount === 0 ? "ADMIN" : "CUSTOMER";

  await prisma.user.create({
    data: {
      name, email, password: hashedPassword, role,
      phone, fax, address, city, state, postalCode, country
    }
  })

  // Trigger registration notification email
  const storeName = await getCMSContent("config_store_name") || "Avenue Book Centre";
  const storePhone = await getCMSContent("config_store_telephone") || "+91 9820088220";
  const storeEmail = await getCMSContent("config_store_email") || "support@avenuebookcentre.com";

  await sendSimulatedEmail(
    email,
    `Welcome to ${storeName}!`,
    `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000000; width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #DDDDDD; background-color: #ffffff;">
  <a href="http://localhost:3000/" title="${storeName}" style="text-decoration: none; display: block; margin-bottom: 20px; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">
    <span style="font-size: 24px; font-weight: bold; color: #555555;">${storeName}</span>
  </a>
  <p style="margin-top: 0px; margin-bottom: 20px;">Dear ${name},</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Thank you for registering your account at <strong>${storeName}</strong>!</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Your account has now been created and you can log in by using your email address and password at our website:</p>
  <p style="margin-top: 0px; margin-bottom: 20px;"><a href="http://localhost:3000/login" style="color: #1f648b; font-weight: bold; text-decoration: underline;">http://localhost:3000/login</a></p>
  
  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;" colspan="2">Your Account Details</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 30%;"><b>Name:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;">${name}</td>
      </tr>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;"><b>Email:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;">${email}</td>
      </tr>
    </tbody>
  </table>
  
  <p style="margin-top: 0px; margin-bottom: 20px;">Upon logging in, you will be able to access other services including reviewing past orders, printing invoices and editing your account information.</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Please reply to this email if you have any questions.</p>
  
  <div style="border-top: 1px solid #EEEEEE; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #777777; text-align: center;">
    <p style="margin: 0 0 5px 0;"><strong>${storeName}</strong></p>
    <p style="margin: 0 0 5px 0;">Telephone: ${storePhone} | Email: ${storeEmail}</p>
    <p style="margin: 0;">&copy; 2026 ${storeName}. All rights reserved.</p>
  </div>
</div>`
  );

  redirect("/login")
}


// Coupon / Promo Code Validation
export async function validateCoupon(code: string) {
  if (!code) return { error: "Please enter a coupon code." };

  try {
    const discount = await prisma.discount.findUnique({
      where: { code: code.toUpperCase().trim() }
    });

    if (!discount) {
      return { error: `Coupon code "${code}" is invalid.` };
    }

    if (!discount.active) {
      return { error: "This promo code is no longer active." };
    }

    if (discount.expiresAt < new Date()) {
      return { error: "This promo code has expired." };
    }

    return {
      success: true,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value,
        minWeight: discount.minWeight
      }
    };
  } catch (e: any) {
    console.error("Coupon validation error:", e);
    return { error: "Error checking coupon code." };
  }
}

// B2C Checkout with Weight, Tax, Shipping & Discount Calculations
export async function createOrder(orderData: {
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  userId?: string | null;
  couponCode?: string | null;
  items: { productId: string; quantity: number; price: number }[];
  shippingMethod?: string | null;
  zipCode?: string | null;
}) {
  const { customerName, customerEmail, shippingAddress, userId, couponCode, items, shippingMethod, zipCode } = orderData;

  if (!customerName || !customerEmail || !shippingAddress || !items || items.length === 0) {
    return { error: "Missing required order information." };
  }

  try {
    // 1. Verify and lock down product stock and aggregate weight on server
    let totalWeight = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return { error: "Product not found in inventory." };
      }

      if (product.stock < item.quantity) {
        return { error: `Insufficient stock for "${product.name}". Only ${product.stock} units remaining.` };
      }

      totalWeight += product.weight * item.quantity;
      validatedItems.push({
        ...item,
        weight: product.weight
      });
    }

    // 2. Fetch and apply coupon discount if provided
    let discountAmount = 0;
    let validCouponCode: string | null = null;

    if (couponCode) {
      const couponRes = await validateCoupon(couponCode);
      if (couponRes.success && couponRes.discount) {
        const discount = couponRes.discount;
        
        // Confirm weight threshold holds true on server
        if (discount.minWeight === 0 || totalWeight >= discount.minWeight) {
          validCouponCode = discount.code;
          const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

          if (discount.type === "PERCENT") {
            discountAmount = subtotal * (discount.value / 100);
          } else if (discount.type === "FLAT") {
            discountAmount = Math.min(discount.value, subtotal);
          }
        }
      }
    }

    // 3. Open transaction to securely deduct stock levels and create receipt records
    const result = await prisma.$transaction(async (tx) => {
      // Deduct stock levels
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        const newStock = (product?.stock || 0) - item.quantity;
        const newStatus = newStock === 0 ? "OUT_OF_STOCK" : (product?.status || "ACTIVE");

        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            status: newStatus
          }
        });
      }

      // Calculate totals
      const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discountedSubtotal = subtotal - discountAmount;

      // Fetch dynamic shipping parameters from DB based on method
      let shippingCost = 0;
      const shippingMethodSelected = shippingMethod || "IPS";

      if (shippingMethodSelected === "IPS") {
        const ipsEnabledDb = await tx.cMSContent.findUnique({ where: { key: "shipping_ips_enabled" } });
        const ipsFreeThresholdDb = await tx.cMSContent.findUnique({ where: { key: "shipping_ips_free_threshold" } });

        const ipsEnabled = ipsEnabledDb ? ipsEnabledDb.value === "true" : true;
        const ipsFreeThreshold = ipsFreeThresholdDb ? parseFloat(ipsFreeThresholdDb.value) : 150.00;

        if (ipsEnabled && discountedSubtotal < ipsFreeThreshold) {
          // Resolve zone based on zip code
          let zip = zipCode || "";
          if (!zip && shippingAddress) {
            const match = shippingAddress.match(/ZIP:\s*(\d{6})/i);
            if (match) zip = match[1];
          }

          const zone = resolveShippingZone(zip);
          let ratesKey = "shipping_ips_rates_national";
          let defaultRates = "0.5:40.00,1:70.00,2:120.00";

          if (zone === "LOCAL") {
            ratesKey = "shipping_ips_rates_local";
            defaultRates = "0.5:20.00,1:30.00,2:50.00";
          } else if (zone === "STATE") {
            ratesKey = "shipping_ips_rates_state";
            defaultRates = "0.5:30.00,1:50.00,2:80.00";
          }

          const ipsRatesDb = await tx.cMSContent.findUnique({ where: { key: ratesKey } });
          const ipsRatesStr = ipsRatesDb ? ipsRatesDb.value : defaultRates;

          // OpenCart dynamic calculation
          const tiers = ipsRatesStr.split(",").map(tier => {
            const parts = tier.split(":");
            return {
              weight: parseFloat(parts[0]),
              cost: parseFloat(parts[1])
            };
          }).filter(t => !isNaN(t.weight) && !isNaN(t.cost));

          tiers.sort((a, b) => a.weight - b.weight);

          let found = false;
          for (const tier of tiers) {
            if (tier.weight >= totalWeight) {
              shippingCost = tier.cost;
              found = true;
              break;
            }
          }

          if (!found && tiers.length > 0) {
            // Fallback: use highest tier cost
            shippingCost = tiers[tiers.length - 1].cost;
          }
        }
      } else if (shippingMethodSelected === "AGGREGATOR") {
        const aggEnabledDb = await tx.cMSContent.findUnique({ where: { key: "shipping_aggregator_enabled" } });
        const aggFreeThresholdDb = await tx.cMSContent.findUnique({ where: { key: "shipping_aggregator_free_threshold" } });
        const aggBaseCostDb = await tx.cMSContent.findUnique({ where: { key: "shipping_aggregator_base_cost" } });
        const aggPerKgCostDb = await tx.cMSContent.findUnique({ where: { key: "shipping_aggregator_per_kg_cost" } });

        const aggEnabled = aggEnabledDb ? aggEnabledDb.value === "true" : false;
        const aggFreeThreshold = aggFreeThresholdDb ? parseFloat(aggFreeThresholdDb.value) : 200.00;
        const aggBaseCost = aggBaseCostDb ? parseFloat(aggBaseCostDb.value) : 60.00;
        const aggPerKgCost = aggPerKgCostDb ? parseFloat(aggPerKgCostDb.value) : 20.00;

        if (aggEnabled && discountedSubtotal < aggFreeThreshold) {
          // Simulated aggregator calculation: base cost + extra weight (per kg after first kg)
          const additionalWeight = Math.max(0, totalWeight - 1.0);
          shippingCost = aggBaseCost + (additionalWeight * aggPerKgCost);
        } else {
          shippingCost = 0.00;
        }
      } else {
        shippingCost = 0.00;
      }

      // FREEHEAVY shipping coupon override
      if (validCouponCode === "FREEHEAVY" && totalWeight >= 3.0) {
        shippingCost = 0.00;
      }

      // 3. Dynamic line-itemized category & product tax calculations
      const globalTaxDb = await tx.cMSContent.findUnique({ where: { key: "tax_rate" } });
      const globalTaxRate = globalTaxDb ? parseFloat(globalTaxDb.value) : 8.0;

      const taxRulesDb = await tx.cMSContent.findUnique({ where: { key: "tax_rules" } });
      let taxRules: any[] = [];
      if (taxRulesDb) {
        try {
          taxRules = JSON.parse(taxRulesDb.value);
        } catch (e) {}
      }

      const orderSubtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const discountRatio = orderSubtotal > 0 ? (orderSubtotal - discountAmount) / orderSubtotal : 0;

      let taxAmount = 0;

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        let activeRule = null;
        if (product) {
          // Match product rule first
          activeRule = taxRules.find(r => r.targetType === "PRODUCT" && r.targetId === product.id);
          // Match category rule second
          if (!activeRule) {
            activeRule = taxRules.find(r => r.targetType === "CATEGORY" && r.targetId === product.categoryId);
          }
        }

        let baseTax = 0;
        if (activeRule) {
          if (activeRule.type === "PERCENT") {
            baseTax = item.price * item.quantity * (activeRule.value / 100);
          } else if (activeRule.type === "AMOUNT") {
            baseTax = activeRule.value * item.quantity;
          }
        } else {
          // Fall back to global rate
          baseTax = item.price * item.quantity * (globalTaxRate / 100);
        }

        taxAmount += baseTax * discountRatio;
      }

      const grandTotal = discountedSubtotal + shippingCost + taxAmount;

      // Create Order
      const order = await tx.order.create({
        data: {
          customerName,
          customerEmail,
          shippingAddress,
          totalAmount: grandTotal,
          shippingWeight: totalWeight,
          shippingCost,
          taxAmount,
          discountCode: validCouponCode,
          discountAmount,
          userId: userId || null,
          shippingMethod: shippingMethodSelected,
          historyLog: JSON.stringify([{
            createdAt: new Date().toISOString(),
            status: "PROCESSING",
            notify: true,
            comment: "Order successfully placed and checked out by customer."
          }]),
          items: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price
            }))
          }
        }
      });

      return order;
    });

    // Fetch detailed order metadata with items and products for the premium invoice email
    const orderWithItems = await prisma.order.findUnique({
      where: { id: result.id },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (orderWithItems) {
      // Fetch dynamic store properties
      const storeName = await getCMSContent("config_store_name") || "Avenue Book Centre";
      const storePhone = await getCMSContent("config_store_telephone") || "+91 9820088220";
      const storeEmail = await getCMSContent("config_store_email") || "support@avenuebookcentre.com";

      // Fetch customer phone number if logged in
      let customerPhone = "N/A";
      if (orderWithItems.userId) {
        const userObj = await prisma.user.findUnique({ where: { id: orderWithItems.userId } });
        if (userObj && userObj.phone) {
          customerPhone = userObj.phone;
        }
      }

      // Fetch dynamic currency settings
      const currency = await getCurrencySettings();
      const symbol = currency.symbol || "₹";

      // Format order id for user display
      const orderIdShort = result.id.substring(0, 8).toUpperCase();

      // Build HTML items table rows in OpenCart style
      const itemRowsHtml = orderWithItems.items
        .map(item => {
          const itemTotal = item.price * item.quantity;
          return `
          <tr>
            <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: left; vertical-align: top;">
              <strong>${item.product.name}</strong>
            </td>
            <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: left; vertical-align: top;">
              ${item.product.sku}
            </td>
            <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; vertical-align: top;">
              ${item.quantity}
            </td>
            <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; vertical-align: top;">
              ${symbol}${item.price.toFixed(2)}
            </td>
            <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; vertical-align: top; font-weight: bold;">
              ${symbol}${itemTotal.toFixed(2)}
            </td>
          </tr>`;
        })
        .join("");

      // Build totals list in OpenCart style
      let totalsHtml = `
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>Sub-Total:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;">${symbol}${(orderWithItems.totalAmount - orderWithItems.shippingCost - orderWithItems.taxAmount + (orderWithItems.discountAmount || 0)).toFixed(2)}</td>
      </tr>`;
      
      if (orderWithItems.discountAmount && orderWithItems.discountAmount > 0) {
        totalsHtml += `
        <tr>
          <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; color: #16a34a;"><b>Discount (${orderWithItems.discountCode || 'Coupon'}):</b></td>
          <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; color: #16a34a;">-${symbol}${orderWithItems.discountAmount.toFixed(2)}</td>
        </tr>`;
      }
      
      const shippingLabel = orderWithItems.shippingMethod === 'IPS' ? 'Indian Postal Service (Speed Post)' : (orderWithItems.shippingMethod === 'PICKUP' ? 'Store Pickup Collection' : 'Delivery');
      totalsHtml += `
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>${shippingLabel} (${orderWithItems.shippingWeight.toFixed(2)} kg):</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;">${orderWithItems.shippingCost === 0 ? 'FREE' : `${symbol}${orderWithItems.shippingCost.toFixed(2)}`}</td>
      </tr>
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>Taxes:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;">${symbol}${orderWithItems.taxAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>Total:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; font-weight: bold; font-size: 13px; color: #1f648b;">${symbol}${orderWithItems.totalAmount.toFixed(2)}</td>
      </tr>`;

      // Send Simulated Email in classic OpenCart style
      await sendSimulatedEmail(
        orderWithItems.customerEmail,
        `Your Order Confirmation (#${orderIdShort}) - ${storeName}`,
        `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000000; width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #DDDDDD; background-color: #ffffff;">
  <a href="http://localhost:3000/" title="${storeName}" style="text-decoration: none; display: block; margin-bottom: 20px; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">
    <span style="font-size: 24px; font-weight: bold; color: #555555;">${storeName}</span>
  </a>
  <p style="margin-top: 0px; margin-bottom: 20px;">Dear ${orderWithItems.customerName},</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Thank you for your interest in <strong>${storeName}</strong> products. Your order has been received and will be processed once payment has been confirmed.</p>
  
  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;" colspan="2">Order Details</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 50%; vertical-align: top;">
          <b>Order ID:</b> #${orderIdShort}<br />
          <b>Date Added:</b> ${new Date(orderWithItems.createdAt).toLocaleDateString('en-GB')}<br />
          <b>Payment Method:</b> Credit Card / Online Gateway<br />
          <b>Shipping Method:</b> ${orderWithItems.shippingMethod === 'IPS' ? 'Indian Postal Service (Speed Post)' : (orderWithItems.shippingMethod === 'PICKUP' ? 'Store Pickup Collection' : 'Delivery')}
        </td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 50%; vertical-align: top;">
          <b>Email:</b> ${orderWithItems.customerEmail}<br />
          <b>Telephone:</b> ${customerPhone}<br />
          <b>IP Address:</b> 127.0.0.1<br />
          <b>Order Status:</b> Processing
        </td>
      </tr>
    </tbody>
  </table>

  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; width: 50%;">Payment Address</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; width: 50%;">Shipping Address</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; vertical-align: top;">
          <strong>${orderWithItems.customerName}</strong><br />
          ${orderWithItems.shippingAddress}
        </td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; vertical-align: top;">
          <strong>${orderWithItems.customerName}</strong><br />
          ${orderWithItems.shippingAddress}
        </td>
      </tr>
    </tbody>
  </table>

  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: left;">Product</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: left;">Model</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: right; width: 10%;">Quantity</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: right; width: 15%;">Unit Price</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: right; width: 15%;">Total</td>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
    <tfoot>
      ${totalsHtml}
    </tfoot>
  </table>

  <p style="margin-top: 0px; margin-bottom: 20px;">Please reply to this email if you have any questions.</p>
  
  <div style="border-top: 1px solid #EEEEEE; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #777777; text-align: center;">
    <p style="margin: 0 0 5px 0;"><strong>${storeName}</strong></p>
    <p style="margin: 0 0 5px 0;">Telephone: ${storePhone} | Email: ${storeEmail}</p>
    <p style="margin: 0;">&copy; 2026 ${storeName}. All rights reserved.</p>
  </div>
</div>`
      );
    }

    return { success: true, orderId: result.id };
  } catch (e: any) {
    console.error("B2C Order transaction failure:", e);
    return { error: e.message || "An unexpected error occurred while processing checkout." };
  }
}

// CMS Content Retrieval
export async function getCMSContent(key: string) {
  try {
    const cms = await prisma.cMSContent.findUnique({
      where: { key }
    });
    return cms?.value || null;
  } catch (e) {
    console.error(`CMS read failed for key ${key}:`, e);
    return null;
  }
}

// CMS Content Editor Update
export async function updateCMSContent(key: string, value: string) {
  try {
    await prisma.cMSContent.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        description: `Dynamic cms content override for key ${key}`
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error(`CMS write failed for key ${key}:`, e);
    return { error: e.message || "Failed to update CMS variable." };
  }
}

// Get All Users for Admin customer management list
export async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        phone: true,
        fax: true,
        address: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return users;
  } catch (e) {
    console.error("Failed to fetch customer directories:", e);
    return [];
  }
}

// Update account permissions role (e.g. CUSTOMER -> STAFF)
export async function promoteUserRole(userId: string, newRole: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
    return { success: true };
  } catch (e: any) {
    console.error(`User promotion failed:`, e);
    return { error: e.message || "Failed to change user permission role." };
  }
}

export async function updateCustomerDetails(userId: string, data: {
  name: string; email: string; role: string; password?: string;
  phone?: string; fax?: string; address?: string; city?: string;
  state?: string; postalCode?: string; country?: string;
}) {
  try {
    const emailLower = data.email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({
      where: { email: emailLower, NOT: { id: userId } }
    });

    if (existing) {
      return { error: "A user already exists with that email address." };
    }

    const updateData: any = {
      name: data.name,
      email: emailLower,
      role: data.role,
      phone: data.phone || null,
      fax: data.fax || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      postalCode: data.postalCode || null,
      country: data.country || null,
    };

    if (data.password && data.password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(data.password, 10);
      updateData.password = hashedPassword;
    }

    const user = await prisma.user.update({ where: { id: userId }, data: updateData });

    return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  } catch (e: any) {
    console.error("Failed to update customer details:", e);
    return { error: e.message || "Failed to update customer credentials." };
  }
}

// Admin-side customer creation (bypass self-registration flow)
export async function createCustomerByAdmin(data: {
  name: string; email: string; password: string; role: string;
  phone?: string; fax?: string; address?: string; city?: string;
  state?: string; postalCode?: string; country?: string;
}) {
  try {
    const emailLower = data.email.toLowerCase().trim();

    if (!data.name || !emailLower || !data.password) {
      return { error: "Name, email and password are all required." };
    }

    const existing = await prisma.user.findUnique({ where: { email: emailLower } });
    if (existing) {
      return { error: "A user with that email address already exists." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: emailLower,
        password: hashedPassword,
        role: data.role || "CUSTOMER",
        phone: data.phone || null,
        fax: data.fax || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country || null,
      }
    });

    // Trigger admin customer registration welcome notification email
    const storeName = await getCMSContent("config_store_name") || "Avenue Book Centre";
    const storePhone = await getCMSContent("config_store_telephone") || "+91 9820088220";
    const storeEmail = await getCMSContent("config_store_email") || "support@avenuebookcentre.com";

    await sendSimulatedEmail(
      emailLower,
      `Your Account is Ready - ${storeName}`,
      `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000000; width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #DDDDDD; background-color: #ffffff;">
  <a href="http://localhost:3000/" title="${storeName}" style="text-decoration: none; display: block; margin-bottom: 20px; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">
    <span style="font-size: 24px; font-weight: bold; color: #555555;">${storeName}</span>
  </a>
  <p style="margin-top: 0px; margin-bottom: 20px;">Dear ${user.name},</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Your customer account at <strong>${storeName}</strong> has been successfully created by our administrator!</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">You can now log in by using your email address and the temporary password at our website:</p>
  <p style="margin-top: 0px; margin-bottom: 20px;"><a href="http://localhost:3000/login" style="color: #1f648b; font-weight: bold; text-decoration: underline;">http://localhost:3000/login</a></p>
  
  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;" colspan="2">Your Log In Credentials</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 30%;"><b>Email ID:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;">${emailLower}</td>
      </tr>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;"><b>Temporary Key:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; font-family: monospace; font-weight: bold; color: #ef4444; font-size: 13px;">${data.password}</td>
      </tr>
    </tbody>
  </table>
  
  <p style="margin-top: 0px; margin-bottom: 20px;">For security reasons, we strongly recommend that you change your password immediately after logging in for the first time.</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Please reply to this email if you have any questions.</p>
  
  <div style="border-top: 1px solid #EEEEEE; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #777777; text-align: center;">
    <p style="margin: 0 0 5px 0;"><strong>${storeName}</strong></p>
    <p style="margin: 0 0 5px 0;">Telephone: ${storePhone} | Email: ${storeEmail}</p>
    <p style="margin: 0;">&copy; 2026 ${storeName}. All rights reserved.</p>
  </div>
</div>`
    );

    return {
      success: true,
      user: {
        id: user.id, name: user.name, email: user.email,
        role: user.role, createdAt: user.createdAt,
        phone: user.phone, fax: user.fax, address: user.address,
        city: user.city, state: user.state, postalCode: user.postalCode, country: user.country,
        _count: { orders: 0 }
      }
    };
  } catch (e: any) {
    console.error("Admin customer creation failed:", e);
    return { error: e.message || "Failed to create customer account." };
  }
}



// Generate high-fidelity reports data inside SQLite
export async function getAnalyticsReports() {
  try {
    const orders = await prisma.order.findMany({
      include: { items: { include: { product: { include: { category: true } } } } }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalWeightShipped = orders.reduce((sum, o) => sum + o.shippingWeight, 0);
    const totalDiscountsGiven = orders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);

    // 1. Coupon redemption stats
    const couponUsage: Record<string, number> = {};
    orders.forEach(o => {
      if (o.discountCode) {
        couponUsage[o.discountCode] = (couponUsage[o.discountCode] || 0) + 1;
      }
    });

    // 2. Sales by Day (last 14 days)
    const salesByDayMap = new Map<string, { date: string; revenue: number; ordersCount: number }>();
    // Pre-fill last 14 days with zero values
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesByDayMap.set(dateStr, { date: dateStr, revenue: 0, ordersCount: 0 });
    }

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      if (salesByDayMap.has(dateStr)) {
        const current = salesByDayMap.get(dateStr)!;
        current.revenue += o.totalAmount;
        current.ordersCount += 1;
      }
    });
    const salesHistory = Array.from(salesByDayMap.values());

    // 3. Top Performing Products (Top 5)
    const productSalesMap = new Map<string, { name: string; sku: string; quantity: number; revenue: number }>();
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!item.product) return;
        const current = productSalesMap.get(item.productId) || {
          name: item.product.name,
          sku: item.product.sku,
          quantity: 0,
          revenue: 0
        };
        current.quantity += item.quantity;
        current.revenue += item.quantity * item.price;
        productSalesMap.set(item.productId, current);
      });
    });
    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // 4. Category Performance
    const categorySalesMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!item.product || !item.product.category) return;
        const catName = item.product.category.name;
        const current = categorySalesMap.get(catName) || { name: catName, revenue: 0, quantity: 0 };
        current.revenue += item.quantity * item.price;
        current.quantity += item.quantity;
        categorySalesMap.set(catName, current);
      });
    });
    const categoryPerformance = Array.from(categorySalesMap.values())
      .sort((a, b) => b.revenue - a.revenue);

    // 5. Top Customers (Top 5)
    const customerMap = new Map<string, { email: string; name: string; ordersCount: number; totalSpent: number }>();
    orders.forEach(o => {
      const email = o.customerEmail.toLowerCase().trim();
      const current = customerMap.get(email) || { email, name: o.customerName, ordersCount: 0, totalSpent: 0 };
      current.ordersCount += 1;
      current.totalSpent += o.totalAmount;
      customerMap.set(email, current);
    });
    const topCustomers = Array.from(customerMap.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);

    // 6. Stock levels
    const thresholdContent = await prisma.cMSContent.findUnique({
      where: { key: "config_stock_threshold" }
    });
    const threshold = thresholdContent ? parseInt(thresholdContent.value) || 10 : 10;

    const lowStockAlerts = await prisma.product.findMany({
      where: { stock: { lt: threshold } },
      include: { category: true }
    });

    // 7. Product-wise Sales Report (All Products Metrics)
    const allProducts = await prisma.product.findMany({
      include: { category: true }
    });
    const productMetrics = allProducts.map(p => {
      const itemStats = orders.reduce((stats, order) => {
        order.items.forEach(item => {
          if (item.productId === p.id) {
            stats.quantity += item.quantity;
            stats.revenue += item.quantity * item.price;
          }
        });
        return stats;
      }, { quantity: 0, revenue: 0 });

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || "Uncategorized",
        quantitySold: itemStats.quantity,
        revenue: itemStats.revenue,
        stock: p.stock,
        status: p.status
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // 8. Detailed Sales Report Grouped by Day
    const salesReportMap = new Map<string, {
      date: string;
      ordersCount: number;
      itemsCount: number;
      taxAmount: number;
      discountAmount: number;
      totalAmount: number;
    }>();

    orders.forEach(o => {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      const itemsCount = o.items.reduce((sum, item) => sum + item.quantity, 0);
      const current = salesReportMap.get(dateStr) || {
        date: dateStr,
        ordersCount: 0,
        itemsCount: 0,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: 0
      };
      current.ordersCount += 1;
      current.itemsCount += itemsCount;
      current.taxAmount += o.taxAmount || 0;
      current.discountAmount += o.discountAmount || 0;
      current.totalAmount += o.totalAmount;
      salesReportMap.set(dateStr, current);
    });

    const salesReport = Array.from(salesReportMap.values())
      .sort((a, b) => b.date.localeCompare(a.date));

    return {
      kpis: {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        totalWeightShipped,
        totalDiscountsGiven
      },
      couponUsage: Object.entries(couponUsage).map(([code, count]) => ({ code, count })),
      salesHistory,
      topProducts,
      categoryPerformance,
      topCustomers,
      lowStockAlerts,
      productMetrics,
      salesReport
    };
  } catch (e) {
    console.error("Failed to compile analytics aggregates:", e);
    return null;
  }
}

// Scraping/Importing external products
export async function importProductFromUrl(url: string) {
  if (!url) return { error: "Please provide a valid product URL." };

  const isAmazonUrl = url.includes("amazon.com") || url.includes("amazon.in") || url.includes("a.co") || url.includes("amzn.to");

  if (isAmazonUrl) {
    try {
      let name = "";
      let description = "";
      let imageUrl = "";
      let price = 0; // Dynamic heuristic price
      let discountPrice: number | null = null;
      let weight = 0.45;
      let parsedBook = false;

      // Follow redirect to get final URL
      let finalUrl = url;
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          },
          redirect: "follow",
          next: { revalidate: 0 }
        });
        if (response.ok) {
          finalUrl = response.url || url;
        }
      } catch (e) {
        console.error("Failed to fetch redirect URL:", e);
      }

      // Extract ASIN/ISBN
      let asin = "";
      const asinRegex = /\/(?:dp|gp\/product|gp\/aw\/d)\/([A-Z0-9]{10})/i;
      const match = finalUrl.match(asinRegex) || url.match(asinRegex);
      if (match && match[1]) {
        asin = match[1];
      }

      // Parse name from URL slug as fallback
      let urlSlugName = "";
      const urlClean = finalUrl.split("?")[0].split("#")[0];
      const urlParts = urlClean.split("/");
      for (const part of urlParts) {
        if (part.includes("-") && !part.includes("amazon") && !part.includes("a.co") && !part.includes("amzn")) {
          if (/[a-z]/i.test(part) && part.length > 5) {
            urlSlugName = part.split("-").join(" ");
            // Title case
            urlSlugName = urlSlugName.replace(/\b\w/g, c => c.toUpperCase());
            break;
          }
        }
      }

      // Try fetching directly first, to see if we can get real details (if not captcha blocked)
      let amazonHtml = "";
      try {
        const response = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
          },
          redirect: "follow",
          next: { revalidate: 0 }
        });
        if (response.ok) {
          amazonHtml = await response.text();
        }
      } catch (e) {
        console.error("Direct Amazon page fetch failed:", e);
      }

      const isCaptcha = amazonHtml.toLowerCase().includes("captcha") || amazonHtml.toLowerCase().includes("robot check") || amazonHtml.length < 10000;

      if (!isCaptcha && amazonHtml) {
        // Try parsing from raw HTML
        const titleMatch = amazonHtml.match(/<span[^>]+id=["']productTitle["'][^>]*>([^<]+)<\/span>/i) ||
                           amazonHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          name = titleMatch[1].trim();
        }
        
        const imgMatch = amazonHtml.match(/["']large["']\s*:\s*["'](https:\/\/[^"']+\.jpg)["']/i) ||
                         amazonHtml.match(/["']mainUrl["']\s*:\s*["'](https:\/\/[^"']+\.jpg)["']/i) ||
                         amazonHtml.match(/<img[^>]+id=["']landingImage["'][^>]+src=["']([^"']+)["']/i);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }

        let parsedPrice = 0;
        let parsedBasisPrice = 0;

        // 1. Parse deal/displayed price
        const priceMatch = amazonHtml.match(/<span[^>]+class=["']a-price-whole["'][^>]*>([^<]+)<\/span>/i) ||
                           amazonHtml.match(/\"price\"\s*:\s*\"?([0-9.]+)\"?/i) ||
                           amazonHtml.match(/priceAmount["']\s*:\s*([0-9.]+)/i);
        if (priceMatch && priceMatch[1]) {
          const val = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ""));
          if (!isNaN(val) && val > 0) {
            parsedPrice = val;
          }
        }

        // 2. Parse basis price / strike price / MRP
        const basisPriceMatch = amazonHtml.match(/<span[^>]+class=["']a-price a-text-price[^"']*["'][^>]*>\s*<span class="a-offscreen">([^<]+)<\/span>/i) ||
                                 amazonHtml.match(/class=["']a-text-strike["'][^>]*>([^<]+)<\/span>/i) ||
                                 amazonHtml.match(/basisPrice["']\s*:\s*([0-9.]+)/i);
        if (basisPriceMatch && basisPriceMatch[1]) {
          const val = parseFloat(basisPriceMatch[1].replace(/[^0-9.]/g, ""));
          if (!isNaN(val) && val > 0) {
            parsedBasisPrice = val;
          }
        }

        // 3. Map to price and discountPrice columns
        if (parsedBasisPrice > 0 && parsedPrice > 0 && parsedBasisPrice > parsedPrice) {
          price = parsedBasisPrice;
          discountPrice = parsedPrice;
        } else if (parsedPrice > 0) {
          price = parsedPrice;
        } else if (parsedBasisPrice > 0) {
          price = parsedBasisPrice;
        }
      }

      // If blocked or not resolved, use API fallbacks
      if (!name) {
        // 1. Look up Open Library Search by ASIN/ISBN
        if (asin && /^[A-Z0-9]{10}$/i.test(asin)) {
          try {
            const olRes = await fetch(`https://openlibrary.org/search.json?q=${asin}&limit=1`, {
              headers: { "User-Agent": "Mozilla/5.0" },
              next: { revalidate: 3600 }
            });
            if (olRes.ok) {
              const olJson = await olRes.json();
              if (olJson.docs && olJson.docs.length > 0) {
                const doc = olJson.docs[0];
                name = doc.title || "";
                if (doc.subtitle) {
                  name += `: ${doc.subtitle}`;
                }
                
                if (doc.cover_i) {
                  imageUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
                }
                
                const authorsStr = doc.author_name ? ` by ${doc.author_name.join(", ")}` : "";
                const publisherStr = doc.publisher ? `, published by ${doc.publisher.join(", ")}` : "";
                const subjectsStr = doc.subject ? ` covering ${doc.subject.slice(0, 5).join(", ")}` : "";
                description = `A book titled "${name}"${authorsStr}${publisherStr}${subjectsStr}.`;
                
                parsedBook = true;
              }
            }
          } catch (err) {
            console.error("Open Library ASIN search failed in import:", err);
          }

          // Direct ISBN lookup if 10-digit number
          if (!name && /^[0-9]{9}[0-9X]$/i.test(asin)) {
            try {
              const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${asin}&format=json&jscmd=data`, {
                headers: { "User-Agent": "Mozilla/5.0" },
                next: { revalidate: 3600 }
              });
              if (olRes.ok) {
                const olJson = await olRes.json();
                const key = `ISBN:${asin}`;
                if (olJson[key]) {
                  const book = olJson[key];
                  name = book.title || "";
                  if (book.subtitle) {
                    name += `: ${book.subtitle}`;
                  }
                  description = book.notes || (book.excerpts && book.excerpts.length > 0 ? book.excerpts[0].text : "");
                  imageUrl = book.cover?.large || book.cover?.medium || book.cover?.small || "";
                  weight = book.weight ? parseFloat(book.weight) : 0.45;
                  parsedBook = true;
                }
              }
            } catch (err) {
              console.error("Open Library direct lookup failed:", err);
            }
          }
        }

        // 2. Look up Open Library by URL Slug name
        if (!name && urlSlugName) {
          try {
            const searchRes = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(urlSlugName)}&limit=1`, {
              headers: { "User-Agent": "Mozilla/5.0" },
              next: { revalidate: 3600 }
            });
            if (searchRes.ok) {
              const searchJson = await searchRes.json();
              if (searchJson.docs && searchJson.docs.length > 0) {
                const doc = searchJson.docs[0];
                const titleLower = (doc.title || "").toLowerCase();
                const slugLower = urlSlugName.toLowerCase();
                
                if (titleLower.includes(slugLower) || slugLower.includes(titleLower) || 
                    slugLower.split(" ").slice(0, 2).every(word => titleLower.includes(word))) {
                  name = doc.title || "";
                  if (doc.subtitle) name += `: ${doc.subtitle}`;
                  if (doc.cover_i) {
                    imageUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
                  }
                  const authorsStr = doc.author_name ? ` by ${doc.author_name.join(", ")}` : "";
                  const publisherStr = doc.publisher ? `, published by ${doc.publisher.join(", ")}` : "";
                  description = `A book titled "${name}"${authorsStr}${publisherStr}.`;
                  parsedBook = true;
                }
              }
            }
          } catch (err) {
            console.error("Open Library slug search failed:", err);
          }
        }

        // 3. Fallback to slug title if no book APIs resolved
        if (!name) {
          name = urlSlugName || "Imported Amazon Product";
        }
      }

      // Heuristic Fallback Description & Image if still missing
      if (!description) {
        description = `Premium quality product imported from Amazon. URL: ${url}`;
      }
      if (!imageUrl) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes("pen") || nameLower.includes("fountain") || nameLower.includes("ink")) {
          imageUrl = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&q=80";
          description = "Executive writing fountain pen with gold details and balanced ink flow.";
        } else if (nameLower.includes("notebook") || nameLower.includes("diary") || nameLower.includes("journal")) {
          imageUrl = "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80";
          description = "Leather-bound personal writing journal notebook with high grade sheets.";
        } else if (nameLower.includes("pencil") || nameLower.includes("art") || nameLower.includes("brush") || nameLower.includes("paint")) {
          imageUrl = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80";
        } else if (nameLower.includes("bag") || nameLower.includes("backpack")) {
          imageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80";
        } else if (nameLower.includes("book") || nameLower.includes("novel") || nameLower.includes("story") || nameLower.includes("textbook")) {
          imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80";
        } else {
          imageUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80";
        }
      }

      // 4. Default dynamic price ranges based on book type heuristics
      if (!price || price <= 0) {
        const titleLower = name.toLowerCase();
        if (titleLower.includes("handbook") || titleLower.includes("guide") || titleLower.includes("volume") || 
            titleLower.includes("illustrated") || titleLower.includes("advanced") || titleLower.includes("engineering") || 
            titleLower.includes("science") || titleLower.includes("computer") || titleLower.includes("programming") || 
            titleLower.includes("textbook") || titleLower.includes("physics") || titleLower.includes("mathematics")) {
          price = 799.00;
        } else if (titleLower.includes("novel") || titleLower.includes("fiction") || titleLower.includes("story") || 
                   titleLower.includes("poetry") || titleLower.includes("romance")) {
          price = 299.00;
        } else {
          const priceTiers = [299.00, 349.00, 399.00, 449.00, 499.00, 599.00];
          const nameHash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          price = priceTiers[nameHash % priceTiers.length];
        }
      }

      // 5. Resolve Category
      let category = await prisma.category.findFirst({
        where: { name: parsedBook ? "Fiction & Literature" : "Imported Catalog" }
      });
      if (!category) {
        category = await prisma.category.findFirst();
      }
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: "Imported Catalog",
            description: "Products imported from external links",
            imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
          }
        });
      }

      // 6. Generate SKU
      const cleanSlug = name.replace(/[^a-z0-9]/gi, "").substring(0, 8).toUpperCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const sku = `IMP-${cleanSlug}-${randomSuffix}`;

      // 7. Create in DB
      const newProduct = await prisma.product.create({
        data: {
          name,
          description: description.substring(0, 450),
          price,
          discountPrice,
          weight,
          sku,
          stock: 50,
          imageUrl,
          categoryId: category.id,
          status: "ACTIVE"
        },
        include: {
          category: true
        }
      });

      return { success: true, product: newProduct };
    } catch (e: any) {
      console.error("Amazon product import failed:", e);
      return { error: e.message || "Failed to process Amazon product URL." };
    }
  }

  const isFlipkartUrl = url.includes("flipkart.com") || url.includes("fkrt.it");

  if (isFlipkartUrl) {
    try {
      let name = "";
      let description = "";
      let imageUrl = "";
      let price = 0;
      let discountPrice: number | null = null;
      let weight = 0.45;
      let parsedBook = false;

      // 1. Extract name from URL slug
      const fkMatch = url.match(/flipkart\.com\/([a-zA-Z0-9-]+)\/p\//i);
      if (fkMatch && fkMatch[1]) {
        const slug = fkMatch[1];
        name = slug.split("-").join(" ").replace(/\b\w/g, c => c.toUpperCase());
      }

      // 2. Extract PID/ISBN
      let isbn = "";
      const pidMatch = url.match(/[?&]pid=([0-9X]{10,13})/i);
      if (pidMatch && pidMatch[1]) {
        isbn = pidMatch[1];
      }

      // 3. Search book API if it's an ISBN (starts with 978 or 979 or has length 10/13)
      if (isbn && (isbn.length === 10 || isbn.length === 13)) {
        try {
          const olRes = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 3600 }
          });
          if (olRes.ok) {
            const olJson = await olRes.json();
            const key = `ISBN:${isbn}`;
            if (olJson[key]) {
              const book = olJson[key];
              name = book.title || name;
              if (book.subtitle) {
                name += `: ${book.subtitle}`;
              }
              description = book.notes || (book.excerpts && book.excerpts.length > 0 ? book.excerpts[0].text : "");
              imageUrl = book.cover?.large || book.cover?.medium || book.cover?.small || "";
              weight = book.weight ? parseFloat(book.weight) : 0.45;
              parsedBook = true;
            }
          }
        } catch (err) {
          console.error("Open Library ISBN search failed in flipkart import:", err);
        }
      }

      // 4. Fallback descriptions/images based on title keywords
      if (!description) {
        description = `Premium quality product imported from Flipkart. Link: ${url}`;
      }
      if (!imageUrl) {
        const nameLower = name.toLowerCase();
        if (nameLower.includes("pen") || nameLower.includes("fountain") || nameLower.includes("ink")) {
          imageUrl = "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=500&q=80";
        } else if (nameLower.includes("notebook") || nameLower.includes("diary") || nameLower.includes("journal")) {
          imageUrl = "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=500&q=80";
        } else if (nameLower.includes("pencil") || nameLower.includes("art") || nameLower.includes("brush") || nameLower.includes("paint")) {
          imageUrl = "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80";
        } else if (nameLower.includes("bag") || nameLower.includes("backpack")) {
          imageUrl = "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&q=80";
        } else if (nameLower.includes("book") || nameLower.includes("novel") || nameLower.includes("story") || nameLower.includes("textbook")) {
          imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80";
        } else {
          imageUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80";
        }
      }

      // 5. Default prices
      if (!price || price <= 0) {
        const titleLower = name.toLowerCase();
        if (titleLower.includes("handbook") || titleLower.includes("guide") || titleLower.includes("volume") || 
            titleLower.includes("illustrated") || titleLower.includes("advanced") || titleLower.includes("engineering") || 
            titleLower.includes("science") || titleLower.includes("computer") || titleLower.includes("programming") || 
            titleLower.includes("textbook") || titleLower.includes("physics") || titleLower.includes("mathematics")) {
          price = 799.00;
        } else if (titleLower.includes("novel") || titleLower.includes("fiction") || titleLower.includes("story") || 
                   titleLower.includes("poetry") || titleLower.includes("romance")) {
          price = 299.00;
        } else {
          const priceTiers = [299.00, 349.00, 399.00, 449.00, 499.00, 599.00];
          const nameHash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
          price = priceTiers[nameHash % priceTiers.length];
        }
      }

      // 6. Resolve Category
      let category = await prisma.category.findFirst({
        where: { name: parsedBook ? "Fiction & Literature" : "Imported Catalog" }
      });
      if (!category) {
        category = await prisma.category.findFirst();
      }
      if (!category) {
        category = await prisma.category.create({
          data: {
            name: "Imported Catalog",
            description: "Products imported from external links",
            imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
          }
        });
      }

      // 7. SKU
      const cleanSlug = name.replace(/[^a-z0-9]/gi, "").substring(0, 8).toUpperCase();
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const sku = `IMP-${cleanSlug}-${randomSuffix}`;

      // 8. Create Product
      const newProduct = await prisma.product.create({
        data: {
          name,
          description: description.substring(0, 450),
          price,
          discountPrice,
          weight,
          sku,
          stock: 50,
          imageUrl,
          categoryId: category.id,
          status: "ACTIVE"
        },
        include: {
          category: true
        }
      });

      return { success: true, product: newProduct };
    } catch (e: any) {
      console.error("Flipkart product import failed:", e);
      return { error: e.message || "Failed to process Flipkart product URL." };
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
      },
      next: { revalidate: 0 }
    });

    if (!response.ok) {
      return { error: `Failed to fetch webpage. HTTP status: ${response.status}` };
    }

    const html = await response.text();

    // 1. Name Parsing
    let name = "";
    const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) || 
                         html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      name = ogTitleMatch[1];
    } else {
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        name = titleMatch[1];
      }
    }
    name = name.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
    if (!name) {
      name = "Imported External Product";
    }

    // 2. Description Parsing
    let description = "";
    const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i) ||
                        html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
                        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    if (ogDescMatch && ogDescMatch[1]) {
      description = ogDescMatch[1];
    }
    description = description.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
    if (!description) {
      description = `Automatically imported product from ${url}`;
    }

    // 3. Image URL Parsing
    let imageUrl = "";
    const ogImgMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogImgMatch && ogImgMatch[1]) {
      imageUrl = ogImgMatch[1];
    }
    if (!imageUrl) {
      // Find first image tag with absolute http path
      const imgMatch = html.match(/<img[^>]+src=["'](https:\/\/[^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
      } else {
        imageUrl = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60";
      }
    }

    // 4. Price Parsing
    let price = 19.99; // Default price
    let discountPrice: number | null = null;
    let parsedPrice = 0;
    let parsedComparePrice = 0;

    // A. Parse standard/deal price first
    const ogPriceMatch = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]+name=["']twitter:data1["'][^>]+value=["']([^"']+)["']/i);
    if (ogPriceMatch && ogPriceMatch[1]) {
      const val = parseFloat(ogPriceMatch[1].replace(/[^0-9.]/g, ""));
      if (!isNaN(val) && val > 0) {
        parsedPrice = val;
      }
    } else {
      const priceJsonMatch = html.match(/"price"\s*:\s*["']?([0-9.]+)/i);
      if (priceJsonMatch && priceJsonMatch[1]) {
        const val = parseFloat(priceJsonMatch[1]);
        if (!isNaN(val) && val > 0) {
          parsedPrice = val;
        }
      } else {
        const dollarMatch = html.match(/\$(\d+(\.\d{2})?)/);
        if (dollarMatch && dollarMatch[1]) {
          const val = parseFloat(dollarMatch[1]);
          if (!isNaN(val) && val > 0) {
            parsedPrice = val;
          }
        }
      }
    }

    // B. Parse compare_at_price (MRP)
    const ogComparePriceMatch = html.match(/<meta[^>]+property=["']product:compare_at_price:amount["'][^>]+content=["']([^"']+)["']/i) ||
                                 html.match(/<meta[^>]+property=["']og:compare_at_price:amount["'][^>]+content=["']([^"']+)["']/i);
    if (ogComparePriceMatch && ogComparePriceMatch[1]) {
      const val = parseFloat(ogComparePriceMatch[1].replace(/[^0-9.]/g, ""));
      if (!isNaN(val) && val > 0) {
        parsedComparePrice = val;
      }
    }

    // C. Map to price and discountPrice
    if (parsedComparePrice > 0 && parsedPrice > 0 && parsedComparePrice > parsedPrice) {
      price = parsedComparePrice;
      discountPrice = parsedPrice;
    } else if (parsedPrice > 0) {
      price = parsedPrice;
    } else if (parsedComparePrice > 0) {
      price = parsedComparePrice;
    }

    // 5. Weight Parsing
    let weight = 0.5; // Default weight
    const weightMatch = html.match(/(\d+(\.\d+)?)\s*(kg|kilogram|g|gram|lbs|pound)/i);
    if (weightMatch) {
      const unit = weightMatch[3].toLowerCase();
      let value = parseFloat(weightMatch[1]);
      if (!isNaN(value)) {
        if (unit === "g" || unit === "gram") {
          value = value / 1000;
        } else if (unit === "lbs" || unit === "pound") {
          value = value * 0.453592;
        }
        weight = Math.max(0.1, parseFloat(value.toFixed(2)));
      }
    }

    // 6. Category Selection
    let category = await prisma.category.findFirst();
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Imported Catalog",
          description: "Products imported from external links",
          imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60"
        }
      });
    }

    // 7. Generate SKU
    const cleanSlug = name.replace(/[^a-z0-9]/gi, "").substring(0, 8).toUpperCase();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const sku = `IMP-${cleanSlug}-${randomSuffix}`;

    // 8. Create Product in DB
    const newProduct = await prisma.product.create({
      data: {
        name,
        description: description.substring(0, 450),
        price,
        discountPrice,
        weight,
        sku,
        stock: 50,
        imageUrl,
        categoryId: category.id,
        status: "ACTIVE"
      },
      include: {
        category: true
      }
    });

    return { success: true, product: newProduct };
  } catch (e: any) {
    console.error("External URL product import failed:", e);
    return { error: e.message || "Failed to read or parse external product URL." };
  }
}

// --- Category Management Server Actions ---
export async function getCategoriesWithProductCount() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        parent: true,
        _count: {
          select: { products: true }
        }
      },
      orderBy: { name: "asc" }
    });
    return categories;
  } catch (e) {
    console.error("Failed to query categories:", e);
    return [];
  }
}

export async function createCategory(data: { name: string; description?: string; imageUrl?: string; parentId?: string }) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        parentId: data.parentId || null
      }
    });
    return { success: true, category };
  } catch (e: any) {
    console.error("Failed to create category node:", e);
    return { error: e.message || "Could not log Category." };
  }
}

export async function deleteCategory(id: string) {
  try {
    await prisma.category.delete({
      where: { id }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Failed to delete category node:", e);
    return { error: e.message || "Failed to delete Category." };
  }
}

export async function updateCategoryNode(id: string, data: { name: string; description?: string; imageUrl?: string; parentId?: string | null }) {
  try {
    if (data.parentId === id) {
      return { error: "A category cannot be its own parent." };
    }

    if (data.parentId) {
      let currentParentId: string | null = data.parentId;
      while (currentParentId) {
        const parentCat: { parentId: string | null } | null = await prisma.category.findUnique({
          where: { id: currentParentId },
          select: { parentId: true }
        });
        if (!parentCat) break;
        if (parentCat.parentId === id) {
          return { error: "Cyclic relationship detected. Parent category cannot be a descendant of this category." };
        }
        currentParentId = parentCat.parentId;
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description || null,
        imageUrl: data.imageUrl || null,
        parentId: data.parentId || null
      }
    });
    return { success: true, category };
  } catch (e: any) {
    console.error("Failed to update category node:", e);
    return { error: e.message || "Could not update Category." };
  }
}


// --- Discount/Coupon Management Server Actions ---
export async function getAllDiscounts() {
  try {
    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: "desc" }
    });
    return discounts;
  } catch (e) {
    console.error("Failed to fetch discounts catalog:", e);
    return [];
  }
}

export async function createDiscount(data: {
  code: string;
  type: string;
  value: number;
  minWeight: number;
  expiresAt: string;
}) {
  try {
    const discount = await prisma.discount.create({
      data: {
        code: data.code.toUpperCase().trim(),
        type: data.type,
        value: data.value,
        minWeight: data.minWeight,
        active: true,
        expiresAt: new Date(data.expiresAt)
      }
    });
    return { success: true, discount };
  } catch (e: any) {
    console.error("Coupon creation failed:", e);
    return { error: e.message || "Failed to create discount coupon." };
  }
}

export async function toggleDiscountActive(id: string, active: boolean) {
  try {
    await prisma.discount.update({
      where: { id },
      data: { active }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Failed to toggle coupon state:", e);
    return { error: e.message || "Failed to change coupon active state." };
  }
}

export async function deleteDiscount(id: string) {
  try {
    await prisma.discount.delete({
      where: { id }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Failed to delete coupon:", e);
    return { error: e.message || "Failed to delete discount coupon." };
  }
}

// --- Shipping Settings telemetry ---
export async function getShippingAnalytics() {
  try {
    const orders = await prisma.order.findMany({
      select: {
        shippingCost: true,
        shippingWeight: true
      }
    });

    const totalShippingCollected = orders.reduce((sum, o) => sum + o.shippingCost, 0);
    const totalShippingWeight = orders.reduce((sum, o) => sum + o.shippingWeight, 0);
    const averageShippingWeight = orders.length > 0 ? totalShippingWeight / orders.length : 0;

    // Load active settings from CMS variables
    const freeThreshold = await prisma.cMSContent.findUnique({ where: { key: "shipping_free_threshold" } });
    const baseCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_base_cost" } });
    const additionalCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_additional_kg_cost" } });
    const baseWeight = await prisma.cMSContent.findUnique({ where: { key: "shipping_base_weight" } });

    const ipsEnabled = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_enabled" } });
    const ipsFreeThreshold = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_free_threshold" } });
    const ipsRatesLocal = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_local" } });
    const ipsRatesState = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_state" } });
    const ipsRatesNational = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_national" } });

    const aggEnabled = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_enabled" } });
    const aggProvider = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_provider" } });
    const aggApiKey = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_api_key" } });
    const aggApiSecret = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_api_secret" } });
    const aggBaseCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_base_cost" } });
    const aggPerKgCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_per_kg_cost" } });
    const aggFreeThreshold = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_free_threshold" } });

    return {
      stats: {
        totalShippingCollected,
        totalShippingWeight,
        averageShippingWeight
      },
      rules: {
        freeThreshold: freeThreshold ? freeThreshold.value : "100.00",
        baseCost: baseCost ? baseCost.value : "4.99",
        additionalCost: additionalCost ? additionalCost.value : "1.99",
        baseWeight: baseWeight ? baseWeight.value : "1.0"
      },
      ipsRules: {
        enabled: ipsEnabled ? ipsEnabled.value : "true",
        freeThreshold: ipsFreeThreshold ? ipsFreeThreshold.value : "150.00",
        ratesLocal: ipsRatesLocal ? ipsRatesLocal.value : "0.5:20.00,1:30.00,2:50.00",
        ratesState: ipsRatesState ? ipsRatesState.value : "0.5:30.00,1:50.00,2:80.00",
        ratesNational: ipsRatesNational ? ipsRatesNational.value : "0.5:40.00,1:70.00,2:120.00"
      },
      aggregatorRules: {
        enabled: aggEnabled ? aggEnabled.value : "false",
        provider: aggProvider ? aggProvider.value : "Shiprocket",
        apiKey: aggApiKey ? aggApiKey.value : "",
        apiSecret: aggApiSecret ? aggApiSecret.value : "",
        baseCost: aggBaseCost ? aggBaseCost.value : "60.00",
        perKgCost: aggPerKgCost ? aggPerKgCost.value : "20.00",
        freeThreshold: aggFreeThreshold ? aggFreeThreshold.value : "200.00"
      }
    };
  } catch (e) {
    console.error("Failed to fetch shipping analytics metrics:", e);
    return null;
  }
}

// --- Tax Settings telemetry ---
export async function getTaxAnalytics() {
  try {
    const orders = await prisma.order.findMany({
      select: {
        taxAmount: true,
        totalAmount: true
      }
    });

    const totalTaxCollected = orders.reduce((sum, o) => sum + o.taxAmount, 0);
    const averageTaxPerOrder = orders.length > 0 ? totalTaxCollected / orders.length : 0;
    const totalOrderRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Load active tax rate from CMS variables
    const taxRateDb = await prisma.cMSContent.findUnique({ where: { key: "tax_rate" } });
    const taxRate = taxRateDb ? taxRateDb.value : "8.0";

    return {
      stats: {
        totalTaxCollected,
        averageTaxPerOrder,
        totalOrderRevenue
      },
      rules: {
        taxRate
      }
    };
  } catch (e) {
    console.error("Failed to query tax analytics metrics:", e);
    return null;
  }
}

// --- Admin Role Privilege Verification ---
export async function checkAdminPrivilege() {
  const session = await auth();
  if (!session || !session.user) {
    return { isAuthorized: false };
  }
  const role = (session.user as any).role;
  const isAuthorized = role === "ADMIN" || role === "STAFF";
  return { isAuthorized, role };
}

export async function verifyAdminRole(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (!user) {
      return { isAuthorized: false };
    }
    const isAuthorized = user.role === "ADMIN" || user.role === "STAFF";
    return { isAuthorized, role: user.role };
  } catch (e) {
    console.error("verifyAdminRole error:", e);
    return { isAuthorized: false };
  }
}

export async function getCurrencySettings() {
  try {
    const symbolDb = await prisma.cMSContent.findUnique({ where: { key: "store_currency_symbol" } });
    const codeDb   = await prisma.cMSContent.findUnique({ where: { key: "store_currency_code" } });
    return {
      symbol: symbolDb?.value || "₹",
      code:   codeDb?.value   || "INR"
    };
  } catch (e) {
    console.error("Failed to query currency settings:", e);
    return { symbol: "₹", code: "INR" };
  }
}

export async function getAllOrdersAdmin() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return orders;
  } catch (e) {
    console.error("Failed to query all orders for admin:", e);
    return [];
  }
}

export async function updateOrderStatus(orderId: string, newStatus: string, notify = true, comment = "", trackingNumber = "", carrier = "") {
  try {
    const existing = await prisma.order.findUnique({
      where: { id: orderId }
    });

    let history = [];
    if (existing && existing.historyLog) {
      try {
        history = JSON.parse(existing.historyLog);
      } catch (e) {}
    }

    history.push({
      createdAt: new Date().toISOString(),
      status: newStatus,
      notify,
      comment: comment || `Order status updated to ${newStatus}.`
    });

    const updateData: any = {
      status: newStatus,
      historyLog: JSON.stringify(history)
    };

    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    if (carrier) {
      updateData.carrier = carrier;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    // Check if the status warrants a simulated email notification (confirmed/dispatched vs rejected/cancelled)
    if (notify && (newStatus === "SHIPPED" || newStatus === "DELIVERED" || newStatus === "CANCELLED")) {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (orderWithItems) {
        const currency = await getCurrencySettings();
        const symbol = currency.symbol || "₹";
        const orderIdShort = orderId.substring(0, 8).toUpperCase();

        // Fetch dynamic store properties
        const storeName = await getCMSContent("config_store_name") || "Avenue Book Centre";
        const storePhone = await getCMSContent("config_store_telephone") || "+91 9820088220";
        const storeEmail = await getCMSContent("config_store_email") || "support@avenuebookcentre.com";

        // Fetch customer phone number if logged in
        let customerPhone = "N/A";
        if (orderWithItems.userId) {
          const userObj = await prisma.user.findUnique({ where: { id: orderWithItems.userId } });
          if (userObj && userObj.phone) {
            customerPhone = userObj.phone;
          }
        }

        // Build custom comments panel if available
        let commentHtml = "";
        if (comment && comment.trim() !== "") {
          commentHtml = `
          <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
            <thead>
              <tr>
                <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;">Instructions / Admin Comments</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; color: #333333; line-height: 1.5;">
                  ${comment}
                </td>
              </tr>
            </tbody>
          </table>`;
        }

        if (newStatus === "SHIPPED" || newStatus === "DELIVERED") {
          const statusLabel = newStatus === "SHIPPED" ? "Shipped" : "Delivered";
          const statusText = newStatus === "SHIPPED" ? "shipped and is on its way" : "delivered successfully";
          const additionalInfo = newStatus === "SHIPPED"
            ? "Your parcel has been handed over to our premium courier service. You can trace its journey using the dashboard track link."
            : "We hope you enjoy your new custom literary collections! Let us know if you need any additional custom assistance.";

          // Build HTML items table rows in OpenCart style
          const itemRowsHtml = orderWithItems.items
            .map(item => {
              const itemTotal = item.price * item.quantity;
              return `
              <tr>
                <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: left; vertical-align: top;">
                  <strong>${item.product.name}</strong>
                </td>
                <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: left; vertical-align: top;">
                  ${item.product.sku}
                </td>
                <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; vertical-align: top;">
                  ${item.quantity}
                </td>
                <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; vertical-align: top;">
                  ${symbol}${item.price.toFixed(2)}
                </td>
                <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; vertical-align: top; font-weight: bold;">
                  ${symbol}${itemTotal.toFixed(2)}
                </td>
              </tr>`;
            })
            .join("");

          let trackingHtml = "";
          const activeTracking = trackingNumber || orderWithItems.trackingNumber || "";
          const activeCarrier = carrier || orderWithItems.carrier || "";
          
          if (newStatus === "SHIPPED" && activeTracking) {
            trackingHtml = `
            <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
              <thead>
                <tr>
                  <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;" colspan="2">Tracking Details</td>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 60%; vertical-align: top; line-height: 1.5;">
                    <b>Logistics Partner:</b> ${activeCarrier || 'Indian Postal Service (Speed Post)'}<br />
                    <b>Tracking Airway Bill (AWB):</b> <code style="font-weight: bold; font-size: 13px; color: #1e293b;">${activeTracking}</code>
                  </td>
                  <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 40%; text-align: center; vertical-align: middle;">
                    <a href="http://localhost:3000/track?id=${orderId}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; padding: 8px 16px; font-weight: bold; text-decoration: none; border-radius: 4px; font-size: 11px;">TRACK PACKAGE ONLINE</a>
                  </td>
                </tr>
              </tbody>
            </table>
            `;
          }

          await sendSimulatedEmail(
            orderWithItems.customerEmail,
            `Your Order is ${statusLabel}! (#${orderIdShort}) - ${storeName}`,
            `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000000; width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #DDDDDD; background-color: #ffffff;">
  <a href="http://localhost:3000/" title="${storeName}" style="text-decoration: none; display: block; margin-bottom: 20px; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">
    <span style="font-size: 24px; font-weight: bold; color: #555555;">${storeName}</span>
  </a>
  <p style="margin-top: 0px; margin-bottom: 20px;">Dear ${orderWithItems.customerName},</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">Your order #[orderIdShort] has been updated to the following status: <strong>${statusLabel}</strong>.</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">${additionalInfo}</p>
  
  ${trackingHtml}
  
  ${commentHtml}
  
  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;" colspan="2">Order Details</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 50%; vertical-align: top;">
           <b>Order ID:</b> #${orderIdShort}<br />
           <b>Date Added:</b> ${new Date(orderWithItems.createdAt).toLocaleDateString('en-GB')}<br />
           <b>Payment Method:</b> Credit Card / Online Gateway<br />
           <b>Shipping Method:</b> ${orderWithItems.shippingMethod === 'IPS' ? 'Indian Postal Service (Speed Post)' : (orderWithItems.shippingMethod === 'PICKUP' ? 'Store Pickup Collection' : 'Delivery')}
        </td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 50%; vertical-align: top;">
           <b>Email:</b> ${orderWithItems.customerEmail}<br />
           <b>Telephone:</b> ${customerPhone}<br />
           <b>IP Address:</b> 127.0.0.1<br />
           <b>Order Status:</b> ${newStatus}
        </td>
      </tr>
    </tbody>
  </table>

  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; width: 50%;">Payment Address</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; width: 50%;">Shipping Address</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; vertical-align: top;">
          <strong>${orderWithItems.customerName}</strong><br />
          ${orderWithItems.shippingAddress}
        </td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; vertical-align: top;">
          <strong>${orderWithItems.customerName}</strong><br />
          ${orderWithItems.shippingAddress}
        </td>
      </tr>
    </tbody>
  </table>

  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: left;">Product</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: left;">Model</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: right; width: 10%;">Quantity</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: right; width: 15%;">Unit Price</td>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555; text-align: right; width: 15%;">Total</td>
      </tr>
    </thead>
    <tbody>
      ${itemRowsHtml}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>Sub-Total:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;">${symbol}${(orderWithItems.totalAmount - orderWithItems.shippingCost - orderWithItems.taxAmount + (orderWithItems.discountAmount || 0)).toFixed(2)}</td>
      </tr>
      ${orderWithItems.discountAmount && orderWithItems.discountAmount > 0 ? `
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; color: #16a34a;"><b>Discount (${orderWithItems.discountCode || 'Coupon'}):</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; color: #16a34a;">-${symbol}${orderWithItems.discountAmount.toFixed(2)}</td>
      </tr>` : ''}
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>${orderWithItems.shippingMethod === 'IPS' ? 'Indian Postal Service (Speed Post)' : (orderWithItems.shippingMethod === 'PICKUP' ? 'Store Pickup Collection' : 'Delivery')} (${orderWithItems.shippingWeight.toFixed(2)} kg):</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;">${orderWithItems.shippingCost === 0 ? 'FREE' : `${symbol}${orderWithItems.shippingCost.toFixed(2)}`}</td>
      </tr>
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>Taxes:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;">${symbol}${orderWithItems.taxAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="4" style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right;"><b>Total:</b></td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; text-align: right; font-weight: bold; font-size: 13px; color: #1f648b;">${symbol}${orderWithItems.totalAmount.toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>

  <p style="margin-top: 0px; margin-bottom: 20px;">Please reply to this email if you have any questions.</p>
  
  <div style="border-top: 1px solid #EEEEEE; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #777777; text-align: center;">
    <p style="margin: 0 0 5px 0;"><strong>${storeName}</strong></p>
    <p style="margin: 0 0 5px 0;">Telephone: ${storePhone} | Email: ${storeEmail}</p>
    <p style="margin: 0;">&copy; 2026 ${storeName}. All rights reserved.</p>
  </div>
</div>`
          );
        } else if (newStatus === "CANCELLED") {
          await sendSimulatedEmail(
            orderWithItems.customerEmail,
            `Order Cancellation Notice (#${orderIdShort}) - ${storeName}`,
            `<div style="font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #000000; width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #DDDDDD; background-color: #ffffff;">
  <a href="http://localhost:3000/" title="${storeName}" style="text-decoration: none; display: block; margin-bottom: 20px; border-bottom: 1px solid #EEEEEE; padding-bottom: 10px;">
    <span style="font-size: 24px; font-weight: bold; color: #555555;">${storeName}</span>
  </a>
  <p style="margin-top: 0px; margin-bottom: 20px;">Dear ${orderWithItems.customerName},</p>
  <p style="margin-top: 0px; margin-bottom: 20px;">We regret to inform you that your order #[orderIdShort] has been cancelled.</p>
  
  ${commentHtml}
  
  <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
    <thead>
      <tr>
        <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px; color: #555555;" colspan="2">Cancellation Details</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 50%; vertical-align: top;">
           <b>Order ID:</b> #${orderIdShort}<br />
           <b>Date Added:</b> ${new Date(orderWithItems.createdAt).toLocaleDateString('en-GB')}<br />
           <b>Total Refund Amount:</b> <span style="color: #ef4444; font-weight: bold;">${symbol}${orderWithItems.totalAmount.toFixed(2)}</span>
        </td>
        <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 50%; vertical-align: top;">
           <b>Payment Status:</b> Refund Processing<br />
           <b>Refund Timeframe:</b> 3-5 Business Days<br />
           <b>Support Email:</b> ${storeEmail}
        </td>
      </tr>
    </tbody>
  </table>

  <p style="margin-top: 0px; margin-bottom: 20px;">If you have any questions regarding this cancellation, or if you believe this was done in error, please contact our support team.</p>
  
  <div style="border-top: 1px solid #EEEEEE; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #777777; text-align: center;">
    <p style="margin: 0 0 5px 0;"><strong>${storeName}</strong></p>
    <p style="margin: 0 0 5px 0;">Telephone: ${storePhone} | Email: ${storeEmail}</p>
    <p style="margin: 0;">&copy; 2026 ${storeName}. All rights reserved.</p>
  </div>
</div>`
          );
        }
      }
    }

    return { success: true, order: updatedOrder };
  } catch (e: any) {
    console.error(`Failed to update order status for ${orderId}:`, e);
    return { error: e.message || "Failed to update order status." };
  }
}

// --- Product Management: Delete ---
export async function deleteProduct(productId: string) {
  try {
    // Check for existing order items referencing this product
    const orderItemCount = await prisma.orderItem.count({
      where: { productId }
    });

    if (orderItemCount > 0) {
      return { error: `Cannot delete: this product is referenced by ${orderItemCount} order(s). Set it to DRAFT instead.` };
    }

    await prisma.product.delete({
      where: { id: productId }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Failed to delete product:", e);
    return { error: e.message || "Failed to delete product." };
  }
}

// --- Product Management: Duplicate ---
export async function duplicateProduct(productId: string) {
  try {
    const original = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!original) {
      return { error: "Source product not found." };
    }

    // Generate a unique SKU for the copy
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const newSku = `${original.sku}-CP${randomSuffix}`;

    const duplicate = await prisma.product.create({
      data: {
        name: `${original.name} (Copy)`,
        description: original.description,
        price: original.price,
        weight: original.weight,
        sku: newSku,
        stock: original.stock,
        imageUrl: original.imageUrl,
        status: "DRAFT",
        categoryId: original.categoryId,
        publisher: original.publisher,
        edition: original.edition,
        editionDate: original.editionDate,
        dimension: original.dimension,
        isbn10: original.isbn10,
        isbn13: original.isbn13,
        fastDispatch: original.fastDispatch,
        discountPrice: original.discountPrice,
        discountEndDate: original.discountEndDate,
      },
      include: { category: true }
    });

    return { success: true, product: duplicate };
  } catch (e: any) {
    console.error("Failed to duplicate product:", e);
    return { error: e.message || "Failed to duplicate product." };
  }
}

// --- Product Management: Direct Price Update ---
export async function updateProductPriceDirect(id: string, price: number, discountPrice?: number | null) {
  try {
    if (price < 0) {
      return { error: "Price cannot be negative." };
    }
    if (discountPrice !== undefined && discountPrice !== null && discountPrice < 0) {
      return { error: "Discount price cannot be negative." };
    }
    const updated = await prisma.product.update({
      where: { id },
      data: {
        price,
        discountPrice: discountPrice === undefined ? undefined : discountPrice
      }
    });
    return { success: true, product: updated };
  } catch (e: any) {
    console.error("Failed to update product price directly:", e);
    return { error: e.message || "Failed to update price." };
  }
}

// --- Product Management: Bulk Delete ---
export async function bulkDeleteProducts(productIds: string[]) {
  if (!productIds.length) return { error: "No products selected." };

  try {
    // Check for any products referenced by orders
    const protectedProducts = await prisma.orderItem.findMany({
      where: { productId: { in: productIds } },
      select: { productId: true, product: { select: { name: true } } },
      distinct: ["productId"]
    });

    const protectedIds = new Set(protectedProducts.map(p => p.productId));
    const deletableIds = productIds.filter(id => !protectedIds.has(id));

    if (deletableIds.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: deletableIds } }
      });
    }

    const skippedCount = protectedIds.size;
    const deletedCount = deletableIds.length;

    if (skippedCount > 0) {
      const skippedNames = protectedProducts.map(p => p.product.name).join(", ");
      return {
        success: true,
        message: `Deleted ${deletedCount} product(s). Skipped ${skippedCount} product(s) with existing orders: ${skippedNames}`
      };
    }

    return { success: true, message: `Successfully deleted ${deletedCount} product(s).` };
  } catch (e: any) {
    console.error("Bulk delete failed:", e);
    return { error: e.message || "Bulk delete failed." };
  }
}

// --- Product Management: Bulk Status Update ---
export async function bulkUpdateProductStatus(productIds: string[], newStatus: string) {
  if (!productIds.length) return { error: "No products selected." };
  if (!["ACTIVE", "DRAFT", "OUT_OF_STOCK"].includes(newStatus)) return { error: "Invalid status." };

  try {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { status: newStatus }
    });
    return { success: true, message: `Updated ${result.count} product(s) to ${newStatus}.` };
  } catch (e: any) {
    console.error("Bulk status update failed:", e);
    return { error: e.message || "Bulk status update failed." };
  }
}

// --- Product Management: Bulk Price Update ---
export async function bulkUpdateProductPrice(productIds: string[], mode: "set" | "adjust_percent" | "adjust_fixed", value: number) {
  if (!productIds.length) return { error: "No products selected." };

  try {
    if (mode === "set") {
      if (value < 0) return { error: "Price cannot be negative." };
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { price: value }
      });
      return { success: true, message: `Set price to ₹${value.toFixed(2)} for ${result.count} product(s).` };
    }

    // For percentage or fixed adjustments, update individually
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true }
    });

    let updatedCount = 0;
    for (const p of products) {
      let newPrice: number;
      if (mode === "adjust_percent") {
        newPrice = p.price * (1 + value / 100);
      } else {
        newPrice = p.price + value;
      }
      newPrice = Math.max(0, parseFloat(newPrice.toFixed(2)));

      await prisma.product.update({
        where: { id: p.id },
        data: { price: newPrice }
      });
      updatedCount++;
    }

    const label = mode === "adjust_percent" ? `${value > 0 ? "+" : ""}${value}%` : `${value > 0 ? "+$" : "-$"}${Math.abs(value).toFixed(2)}`;
    return { success: true, message: `Adjusted prices by ${label} for ${updatedCount} product(s).` };
  } catch (e: any) {
    console.error("Bulk price update failed:", e);
    return { error: e.message || "Bulk price update failed." };
  }
}

// --- Product Management: Bulk Stock Update ---
export async function bulkUpdateProductStock(productIds: string[], mode: "set" | "adjust", value: number) {
  if (!productIds.length) return { error: "No products selected." };

  try {
    if (mode === "set") {
      if (value < 0) return { error: "Stock cannot be negative." };
      const result = await prisma.product.updateMany({
        where: { id: { in: productIds } },
        data: { stock: Math.floor(value) }
      });
      return { success: true, message: `Set stock to ${Math.floor(value)} for ${result.count} product(s).` };
    }

    // Adjust mode: add/subtract individually, floor at 0
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, stock: true }
    });

    let updatedCount = 0;
    for (const p of products) {
      const newStock = Math.max(0, p.stock + Math.floor(value));
      await prisma.product.update({
        where: { id: p.id },
        data: { stock: newStock }
      });
      updatedCount++;
    }

    return { success: true, message: `Adjusted stock by ${value > 0 ? "+" : ""}${Math.floor(value)} for ${updatedCount} product(s).` };
  } catch (e: any) {
    console.error("Bulk stock update failed:", e);
    return { error: e.message || "Bulk stock update failed." };
  }
}

// --- Product Management: Bulk Category Update ---
export async function bulkUpdateProductCategory(productIds: string[], categoryId: string) {
  if (!productIds.length) return { error: "No products selected." };

  try {
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });
    if (!category) {
      return { error: "Target category does not exist." };
    }

    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { categoryId }
    });
    return { success: true, message: `Updated category to "${category.name}" for ${result.count} product(s).` };
  } catch (e: any) {
    console.error("Bulk category update failed:", e);
    return { error: e.message || "Bulk category update failed." };
  }
}

// --- Product Management: Bulk Fast Dispatch Update ---
export async function bulkUpdateProductFastDispatch(productIds: string[], enabled: boolean) {
  if (!productIds.length) return { error: "No products selected." };

  try {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { fastDispatch: enabled }
    });
    return { success: true, message: `Fast Dispatch ${enabled ? "enabled" : "disabled"} for ${result.count} product(s).` };
  } catch (e: any) {
    console.error("Bulk fast dispatch update failed:", e);
    return { error: e.message || "Bulk fast dispatch update failed." };
  }
}

// --- Itemized dynamic category & product tax overrides ---
export async function getTaxRules() {
  try {
    const taxRateDb = await prisma.cMSContent.findUnique({ where: { key: "tax_rate" } });
    const globalRate = taxRateDb ? parseFloat(taxRateDb.value) : 8.0;

    const rulesDb = await prisma.cMSContent.findUnique({ where: { key: "tax_rules" } });
    let rules: any[] = [];
    if (rulesDb) {
      rules = JSON.parse(rulesDb.value);
    }
    return { globalRate, rules };
  } catch (e) {
    console.error("Failed to fetch tax rules:", e);
    return { globalRate: 8.0, rules: [] };
  }
}

export async function saveTaxRules(rulesJson: string) {
  try {
    await prisma.cMSContent.upsert({
      where: { key: "tax_rules" },
      update: { value: rulesJson },
      create: {
        key: "tax_rules",
        value: rulesJson,
        description: "Custom line-itemized category and product tax rules"
      }
    });
    return { success: true };
  } catch (e: any) {
    console.error("Failed to save tax rules:", e);
    return { error: e.message || "Failed to update customized tax overrides." };
  }
}

export async function createBulkOrder(data: {
  organizationName: string;
  orgType: string;
  productCategory: string;
  quantityRange: string;
  contactName: string;
  email: string;
  phone: string;
  comments?: string;
}) {
  try {
    const bulkOrder = await prisma.bulkOrder.create({
      data: {
        organizationName: data.organizationName,
        orgType: data.orgType,
        productCategory: data.productCategory,
        quantityRange: data.quantityRange,
        contactName: data.contactName,
        email: data.email,
        phone: data.phone,
        comments: data.comments || null
      }
    });

    // Trigger notification email simulation
    const storeName = await getCMSContent("config_store_name") || "Avenue Book Centre";
    const storePhone = await getCMSContent("config_store_telephone") || "+91 9820088220";
    const storeEmail = await getCMSContent("config_store_email") || "support@avenuebookcentre.com";

    await sendSimulatedEmail(
      data.email,
      `We Received Your Bulk Order Inquiry! - ${storeName}`,
      `<div style="font-family: Arial, sans-serif; font-size: 12px; color: #333333; width: 680px; margin: 0 auto; padding: 20px; border: 1px solid #DDDDDD; background-color: #ffffff;">
        <h3>Wholesale Bulk Order Inquiry Received</h3>
        <p>Dear ${data.contactName},</p>
        <p>Thank you for submitting a wholesale bulk order request at <strong>${storeName}</strong>!</p>
        <p>A corporate accounts manager is reviewing your requirements and will reach out to you within 4 hours to provide a custom discount quote and verify availability.</p>
        
        <table style="border-collapse: collapse; width: 100%; border: 1px solid #DDDDDD; margin-bottom: 20px;">
          <thead>
            <tr>
              <td style="font-size: 12px; font-weight: bold; background-color: #EFEFEF; padding: 7px;" colspan="2">Inquiry Reference ID: ${bulkOrder.id}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px; width: 30%;"><b>Organization:</b></td>
              <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;">${data.organizationName} (${data.orgType})</td>
            </tr>
            <tr>
              <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;"><b>Categories Needed:</b></td>
              <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;">${data.productCategory}</td>
            </tr>
            <tr>
              <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;"><b>Target Volume:</b></td>
              <td style="font-size: 12px; border: 1px solid #DDDDDD; padding: 7px;">${data.quantityRange} units</td>
            </tr>
          </tbody>
        </table>
        
        <p>If you have a list of titles/materials, you can reply directly to this email to attach the spreadsheet file.</p>
        <div style="border-top: 1px solid #EEEEEE; padding-top: 10px; margin-top: 20px; font-size: 11px; color: #777777; text-align: center;">
          <p><strong>${storeName} Wholesale Department</strong></p>
          <p>Telephone: ${storePhone} | Email: ${storeEmail}</p>
        </div>
      </div>`
    );

    return { success: true, id: bulkOrder.id };
  } catch (e: any) {
    console.error("Failed to create bulk order:", e);
    return { error: e.message || "An unexpected error occurred while saving your wholesale inquiry." };
  }
}

export async function getBulkOrders() {
  try {
    const orders = await prisma.bulkOrder.findMany({
      orderBy: {
        createdAt: "desc"
      }
    });
    return { success: true, orders };
  } catch (e: any) {
    console.error("Failed to fetch bulk orders:", e);
    return { success: false, error: e.message || "Failed to fetch bulk orders." };
  }
}

export async function updateBulkOrderStatus(id: string, status: string) {
  try {
    const updated = await prisma.bulkOrder.update({
      where: { id },
      data: { status }
    });
    return { success: true, order: updated };
  } catch (e: any) {
    console.error("Failed to update bulk order status:", e);
    return { success: false, error: e.message || "Failed to update bulk order status." };
  }
}

export async function getRecommendationsCatalog() {
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { category: true }
    });
    return { success: true, products };
  } catch (e: any) {
    console.error("Failed to fetch catalog for recommendations:", e);
    return { success: false, error: e.message || "Failed to fetch catalog." };
  }
}

export async function getShippingSettings() {
  try {
    const freeThreshold = await prisma.cMSContent.findUnique({ where: { key: "shipping_free_threshold" } });
    const baseCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_base_cost" } });
    const additionalCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_additional_kg_cost" } });
    const baseWeight = await prisma.cMSContent.findUnique({ where: { key: "shipping_base_weight" } });

    const ipsEnabled = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_enabled" } });
    const ipsFreeThreshold = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_free_threshold" } });
    const ipsRatesLocal = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_local" } });
    const ipsRatesState = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_state" } });
    const ipsRatesNational = await prisma.cMSContent.findUnique({ where: { key: "shipping_ips_rates_national" } });

    const aggEnabled = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_enabled" } });
    const aggProvider = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_provider" } });
    const aggApiKey = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_api_key" } });
    const aggApiSecret = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_api_secret" } });
    const aggBaseCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_base_cost" } });
    const aggPerKgCost = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_per_kg_cost" } });
    const aggFreeThreshold = await prisma.cMSContent.findUnique({ where: { key: "shipping_aggregator_free_threshold" } });

    return {
      flat: {
        freeThreshold: freeThreshold ? freeThreshold.value : "100.00",
        baseCost: baseCost ? baseCost.value : "4.99",
        additionalCost: additionalCost ? additionalCost.value : "1.99",
        baseWeight: baseWeight ? baseWeight.value : "1.0",
      },
      ips: {
        enabled: ipsEnabled ? ipsEnabled.value === "true" : true,
        freeThreshold: ipsFreeThreshold ? ipsFreeThreshold.value : "150.00",
        ratesLocal: ipsRatesLocal ? ipsRatesLocal.value : "0.5:20.00,1:30.00,2:50.00",
        ratesState: ipsRatesState ? ipsRatesState.value : "0.5:30.00,1:50.00,2:80.00",
        ratesNational: ipsRatesNational ? ipsRatesNational.value : "0.5:40.00,1:70.00,2:120.00"
      },
      aggregator: {
        enabled: aggEnabled ? aggEnabled.value === "true" : false,
        provider: aggProvider ? aggProvider.value : "Shiprocket",
        apiKey: aggApiKey ? aggApiKey.value : "",
        apiSecret: aggApiSecret ? aggApiSecret.value : "",
        baseCost: aggBaseCost ? aggBaseCost.value : "60.00",
        perKgCost: aggPerKgCost ? aggPerKgCost.value : "20.00",
        freeThreshold: aggFreeThreshold ? aggFreeThreshold.value : "200.00"
      }
    };
  } catch (e) {
    console.error("Failed to load shipping settings:", e);
    return {
      flat: { freeThreshold: "100.00", baseCost: "4.99", additionalCost: "1.99", baseWeight: "1.0" },
      ips: { enabled: true, freeThreshold: "150.00", ratesLocal: "0.5:20.00,1:30.00,2:50.00", ratesState: "0.5:30.00,1:50.00,2:80.00", ratesNational: "0.5:40.00,1:70.00,2:120.00" },
      aggregator: { enabled: false, provider: "Shiprocket", apiKey: "", apiSecret: "", baseCost: "60.00", perKgCost: "20.00", freeThreshold: "200.00" }
    };
  }
}

export async function trackOrder(idOrTracking: string) {
  try {
    const trimmed = idOrTracking.trim();
    if (!trimmed) {
      return { error: "Please enter a valid Order ID or Tracking Number." };
    }

    // Search by exact Order ID
    let order = await prisma.order.findUnique({
      where: { id: trimmed },
      include: {
        items: {
          include: {
            product: true
          }
        }
      }
    });

    // Fallback: search by tracking number
    if (!order) {
      order = await prisma.order.findFirst({
        where: {
          trackingNumber: trimmed
        },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
    }

    if (!order) {
      return { error: "No package found matching the provided identifier." };
    }

    return {
      success: true,
      order: {
        id: order.id,
        customerName: order.customerName,
        shippingAddress: order.shippingAddress,
        totalAmount: order.totalAmount,
        shippingWeight: order.shippingWeight,
        shippingCost: order.shippingCost,
        taxAmount: order.taxAmount,
        discountCode: order.discountCode,
        discountAmount: order.discountAmount,
        status: order.status,
        historyLog: order.historyLog,
        shippingMethod: order.shippingMethod,
        trackingNumber: order.trackingNumber,
        carrier: order.carrier,
        createdAt: order.createdAt,
        items: order.items
      }
    };
  } catch (e: any) {
    console.error("Tracking lookup failed:", e);
    return { error: "An unexpected database error occurred during parcel trace lookup." };
  }
}
