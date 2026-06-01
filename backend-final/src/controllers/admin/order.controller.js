const orderService = require("../../services/order.service");
const nimbusService = require("../../services/nimbus.service");
const Sequelize = require("../../config/db");
const { Order, OrderItem, Product, User } = require("../../models");
const { Orders } = require("../../config/permission");
const { Op, fn, col, literal } = require("sequelize");
const { extractToken } = require("../../config/jwt");

/**
 * GET ALL ORDERS (ADMIN)
 */
exports.getAllOrders = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    const { rows, count } = await orderService.getAdminOrders({ page, limit, search });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;

    const { orderId, status, shipmentId } = req.body;

    if (!orderId)
      return res.status(400).json({ success: false, message: "orderId is required" });

    const order = await Order.findByPk(orderId);

    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    const oldStatus = order.eOrderStatus;
    order.eOrderStatus = status;
    if (shipmentId !== undefined) {
      order.ShipmentId = shipmentId;
    }
    await order.save();

    // NEW: If the entire order is cancelled (status 0), update all its items to status 0
    if (Number(status) === 0) {
      await OrderItem.update(
        { eStatus: 0 },
        { where: { OrderId: orderId } }
      );
    }

    // If status is 2 (Confirmed/Approved), push to NimbusPost if not already done
    if (Number(status) === 2 && !order.ShiprocketOrderId) {
      try {
        await orderService.pushToNimbus(order.id);
      } catch (srError) {

        // Revert status to old one (Pending) if Nimbus push fails
        order.eOrderStatus = oldStatus;
        await order.save();

        const isLowBalance = srError.message.toLowerCase().includes("balance") || srError.message.includes("LOW_BALANCE");

        return res.status(200).json({
          success: false, // Changed to false because the overall operation (Confirm + Push) failed
          message: isLowBalance
            ? "Sync failed: LOW BALANCE in NimbusPost. Order stayed in Pending."
            : `Sync failed: ${srError.message}. Order stayed in Pending.`,
          nimbusError: true,
          reverted: true
        });
      }
    }

    return res.status(200).json({ success: true, message: "Order status updated successfully" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE ORDER PAYMENT (ADMIN)
 * Allows admin to mark paid/unpaid/partially paid.
 */
exports.updateOrderPayment = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;

    const { orderId, paymentStatus, paidAmount, transactionId } = req.body;

    if (!orderId)
      return res.status(400).json({ success: false, message: "orderId is required" });

    const order = await Order.findByPk(orderId);
    if (!order)
      return res.status(404).json({ success: false, message: "Order not found" });

    if (req.body?.amount !== undefined) {
      return res.status(400).json({
        success: false,
        message: "Order Amount updates are not supported from this endpoint"
      });
    }


    const status = String(paymentStatus ?? "").trim();
    if (!["Unpaid", "Partially Paid", "Paid"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "paymentStatus must be one of: Unpaid, Partially Paid, Paid"
      });
    }

    const totalAmount = Number(order.Amount ?? 0) || 0;
    const currentPaid = Number(order.PaidAmount ?? 0) || 0;

    let nextPaid = currentPaid;
    let nextPaymentCode = order.ePaymentStatus ?? 0;

    if (status === "Unpaid") {
      nextPaid = 0;
      nextPaymentCode = 0;
    } else if (status === "Paid") {
      nextPaid = totalAmount;
      nextPaymentCode = 2;
    } else if (status === "Partially Paid") {
      const delta = Number(paidAmount);
      if (!Number.isFinite(delta) || delta <= 0) {
        return res.status(400).json({ success: false, message: "paidAmount must be a positive number for Partially Paid" });
      }
      nextPaid = Math.min(totalAmount, currentPaid + delta);
      nextPaymentCode = nextPaid >= totalAmount ? 2 : 1;
    }

    // Clamp if total amount changed
    if (nextPaid > totalAmount) nextPaid = totalAmount;

    order.PaidAmount = nextPaid;
    order.ePaymentStatus = nextPaymentCode;

    if (nextPaid > 0) {
      const tx = String(transactionId ?? "").trim();
      if (tx) {
        order.TransactionId = tx;
      } else if (!order.TransactionId) {
        order.TransactionId = `MANUAL-${Date.now()}`;
      }
    } else {
      order.TransactionId = null;
    }

    await order.save();

    const remainingAmount = Math.max(0, (Number(order.Amount ?? 0) || 0) - (Number(order.PaidAmount ?? 0) || 0));
    const paymentStatusText = order.ePaymentStatus === 2 ? "Paid" : order.ePaymentStatus === 1 ? "Partially Paid" : "Unpaid";

    return res.status(200).json({
      success: true,
      message: "Order payment updated successfully",
      data: {
        id: order.id,
        Amount: order.Amount,
        PaidAmount: order.PaidAmount,
        RemainingAmount: remainingAmount,
        paymentStatus: paymentStatusText,
        TransactionId: order.TransactionId,
        paid: Boolean(order.TransactionId)
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PLACE ORDER (USER)
 */
exports.placeOrder = async (req, res) => {
  try {
    const jwt = extractToken(req);

    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const customerId = Token.id;
    let { items, transactionId, addressId, couponCode, paymentMethod } = req.body;

    // Handle items if it comes as a string (from FormData)
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (err) {
        return res.status(400).json({ success: false, message: "Invalid items format" });
      }
    }

    const paymentSlip = req.file ? `/uploads/${req.file.filename}` : null;

    if (!items || !items.length)
      return res.status(400).json({ success: false, message: "Order items are required" });

    if (!addressId)
      return res.status(400).json({ success: false, message: "Address is required" });

    const order = await orderService.createOrder({
      customerId,
      items,
      transactionId,
      addressId,
      couponCode,
      paymentMethod,
      paymentSlip
    });

    return res.status(201).json({ success: true, message: "Order placed successfully", orderId: order.id, orderNo: order.OrderNo });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET USER ORDERS
 */
exports.getMyOrders = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    if (!Token.id)
      return res.status(401).json({ success: false, message: "Invalid User Token." });

    const customerId = Token.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const { rows, count } = await orderService.getOrdersByCustomer(customerId, { page, limit });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET SINGLE ORDER DETAILS
 */
exports.getOrderDetails = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    // Permission check? 
    // Both Admin and Customer can view details, but Customer only their own.
    const Token = jwt.Token;
    const { id } = req.params;

    if (!id) return res.status(400).json({ success: false, message: "Order ID required" });

    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Access Control
    // Customers can view their own orders. Admin can view any order.
    const isAdmin = Token.role === "AdminUser" || (Token.permissions && Token.permissions.includes(Orders));
    const isOwner = Number(order.CustomerId) === Number(Token.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Unauthorized access to this order." });
    }

    return res.status(200).json({ success: true, data: order });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DOWNLOAD INVOICE PDF
 */
const PDFDocument = require('pdfkit');

exports.downloadInvoice = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true) return res.status(401).json(jwt);

    const { id } = req.params;
    const order = await orderService.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const Token = jwt.Token;
    const isAdmin = Token.role === "AdminUser";
    const isOwner = (Token.role === "User" || !Token.role) &&
      order.CustomerId &&
      Number(order.CustomerId) === Number(Token.id);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only download your own invoices."
      });
    }

    const doc = new PDFDocument({ margin: 50 });
    const peacockColor = "#1A8072";
    const goldColor = "#B8860B";
    const textColor = "#333333";
    const lightGray = "#f4f4f4";

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${order.OrderNo || order.id}.pdf`);

    doc.pipe(res);

    // --- Header Section ---
    doc.rect(0, 0, doc.page.width, 160).fill(peacockColor);

    doc.fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(30)
      .text("Shri Radhe Collection", 50, 45)
      .fontSize(10)
      .font("Helvetica")
      .text("PURE • PREMIUM • AUTHENTIC", 50, 80);

    doc.fillColor("#FFFFFF")
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("INVOICE", 400, 45, { align: "right" })
      .fontSize(10)
      .font("Helvetica")
      .text(`#${order.OrderNo || order.id}`, 400, 75, { align: "right" })
      .text(`Date: ${new Date(order.OrderDate).toLocaleDateString()}`, 400, 90, { align: "right" });

    // --- Company & Billing Info ---
    doc.fillColor(textColor);

    // Vendor Info (Stylized Box)
    const infoBoxHeight = 110;
    doc.rect(50, 180, 240, infoBoxHeight).fill(lightGray);
    doc.fillColor(peacockColor).font("Helvetica-Bold").fontSize(9).text("SENDER / FROM:", 60, 190);
    doc.fillColor(textColor).font("Helvetica-Bold").fontSize(12).text("Shri Radhe Collection", 60, 205);
    doc.font("Helvetica").fontSize(10).text("Gwalior, Madhya Pradesh", 60, 222);
    doc.text("India", 60, 237);

    // Customer Info (Stylized Box)
    doc.rect(310, 180, 240, infoBoxHeight).fill(lightGray);
    doc.fillColor(peacockColor).font("Helvetica-Bold").fontSize(9).text("SHIP TO / BILL TO:", 320, 190);
    doc.fillColor(textColor).font("Helvetica-Bold").fontSize(11).text(order.User?.name || 'Valued Customer', 320, 205);

    const addr = order.CustomerAddress?.address || '';
    const city = order.CustomerAddress?.city || '';
    const state = order.CustomerAddress?.state || '';
    const pincode = order.CustomerAddress?.pincode || '';

    doc.font("Helvetica").fontSize(9).text(addr, 320, 220, { width: 220, height: 25 });
    let locationLine = [city, state].filter(Boolean).join(', ');
    if (pincode) locationLine += ` - ${pincode}`;
    if (locationLine) doc.text(locationLine, 320, 248);

    // Payment Method inside Customer Box
    doc.fillColor(peacockColor).fontSize(8).font("Helvetica-Bold").text("PAYMENT METHOD:", 320, 268);
    doc.fillColor(textColor).fontSize(9).font("Helvetica").text(order.PaymentMethod || "Not Specified", 400, 267);

    // --- Items Table ---
    const tableTop = 310;

    doc.rect(50, tableTop, 500, 25).fill(peacockColor);
    doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);
    doc.text("PRODUCT NAME", 60, tableTop + 8);
    doc.text("UNIT COST", 280, tableTop + 8, { width: 80, align: "right" });
    doc.text("QTY", 370, tableTop + 8, { width: 50, align: "right" });
    doc.text("TOTAL", 430, tableTop + 8, { width: 110, align: "right" });

    let currentY = tableTop + 25;

    // Table Rows
    doc.fillColor(textColor).font("Helvetica");
    order.OrderItems.forEach((item, index) => {
      const rowHeight = 30;
      if (index % 2 === 0) {
        doc.rect(50, currentY, 500, rowHeight).fill("#FAFAFA");
      }

      doc.fillColor(textColor).fontSize(9);
      // Correction: item.Price is the Unit Price, calculate Line Total accordingly
      const unitCost = Number(item.Price).toFixed(2);
      const lineTotal = (Number(item.Price) * item.Qty).toFixed(2);

      doc.text(item.Product?.name || "Product", 60, currentY + 10, { width: 210, height: 15, ellipsis: true });
      doc.text(`Rs. ${unitCost}`, 280, currentY + 10, { width: 80, align: "right" });
      doc.text(item.Qty.toString(), 370, currentY + 10, { width: 50, align: "right" });
      doc.text(`Rs. ${lineTotal}`, 430, currentY + 10, { width: 110, align: "right" });

      currentY += rowHeight;
    });

    // --- Footer Summary ---
    const summaryX = 350;
    currentY += 15;

    // Subtotal: sum of (price * qty)
    const itemsSubtotal = order.OrderItems.reduce((sum, item) => sum + (Number(item.Price) * item.Qty), 0);
    const tax = Number(order.TaxAmount || 0);
    const delivery = Number(order.DeliveryCharges || 0);
    const discount = Number(order.DiscountAmount || 0);

    doc.font("Helvetica").fontSize(10).fillColor("#777777");

    // Subtotal
    doc.text("Sub-total:", summaryX, currentY);
    doc.text(`Rs. ${itemsSubtotal.toFixed(2)}`, 450, currentY, { align: "right" });

    // Shipping
    if (delivery > 0) {
      currentY += 18;
      doc.text("Shipping Charges:", summaryX, currentY);
      doc.text(`Rs. ${delivery.toFixed(2)}`, 450, currentY, { align: "right" });
    }

    // Tax
    if (tax > 0) {
      currentY += 18;
      doc.text("Tax Amount:", summaryX, currentY);
      doc.text(`Rs. ${tax.toFixed(2)}`, 450, currentY, { align: "right" });
    }

    // Discount
    if (discount > 0) {
      currentY += 18;
      doc.fillColor("#e53e3e").text("Discount:", summaryX, currentY);
      doc.text(`- Rs. ${discount.toFixed(2)}`, 450, currentY, { align: "right" });
    }

    currentY += 15;
    doc.strokeColor(lightGray).lineWidth(1).moveTo(summaryX, currentY).lineTo(550, currentY).stroke();

    currentY += 10;
    doc.font("Helvetica-Bold").fontSize(16).fillColor(peacockColor);
    doc.text("Grand Total:", summaryX - 20, currentY);
    doc.fillColor(goldColor).text(`Rs. ${Number(order.Amount).toFixed(2)}`, 400, currentY, { align: "right" });

    // Final Note (Positioned relative to content to avoid extra pages)
    currentY = Math.max(currentY + 60, 650);

    doc.end();

  } catch (error) {
    if (!res.headersSent) res.status(500).json({ success: false, message: error.message });
  }
};

function generateTableRow(doc, y, item, unitCost, quantity, lineTotal) {
  // Keeping these for backward compatibility if called elsewhere, but we inlined the logic for better styling
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: "right" })
    .text(quantity, 370, y, { width: 90, align: "right" })
    .text(lineTotal, 0, y, { align: "right" });
}

function generateHr(doc, y) {
  doc
    .strokeColor("#eeeeee")
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke();
}

/**
 * Get Product-wise pending (not packed) order qty
 */
exports.getPendingProductQty = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    // Middleware handles permissions

    // Note: OrderItem model does not have `isPacked`. We treat "pending to pack" as
    // items belonging to active order-items in orders that are not yet delivered.
    // Adjust these statuses if your business rules differ.
    // Include status 5 (Partially Delivered) to track remaining items
    const data = await OrderItem.findAll({
      where: {
        IsActive: true
      },
      attributes: [
        "ItemId",
        [fn("SUM", literal("OrderItem.Qty - COALESCE(OrderItem.DeliveredQty, 0)")), "remainingQty"],
        [fn("SUM", col("OrderItem.Qty")), "totalQty"],
        [fn("COUNT", fn("DISTINCT", col("OrderItem.OrderId"))), "totalOrders"]
      ],
      include: [
        {
          model: Order,
          attributes: [],
          required: true,
          where: {
            eOrderStatus: { [Op.in]: [1, 2, 3, 5] }
          }
        },
        {
          model: Product,
          attributes: ["id", "name", "Weight", "Price"]
        }
      ],
      group: [
        "OrderItem.ItemId",
        "Product.id",
        "Product.name",
        "Product.Weight",
        "Product.Price"
      ],
      order: [[literal("remainingQty"), "DESC"]]
    });

    const response = data.map(item => {
      const p = item.Product ? (item.Product.toJSON ? item.Product.toJSON() : item.Product) : {};
      return {
        productId: p.id ?? item.ItemId,
        productName: p.name ?? null,
        weight: p.Weight ?? null,
        unitPrice: p.Price ?? null,
        remainingQty: Number(item.get("remainingQty")),
        totalQty: Number(item.get("totalQty")),
        totalOrders: Number(item.get("totalOrders"))
      };
    });

    return res.status(200).json({ success: true, count: response.length, data: response });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch pending packed products" });
  }
};

exports.getOrderStatusCounts = async (req, res) => {
  try {
    const results = await Order.findAll({
      attributes: [
        "eOrderStatus",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"]
      ],
      group: ["eOrderStatus"]
    });

    // Default response structure (all statuses)
    const response = {
      pending: 0,
      confirmed: 0,
      packaging: 0,
      outForDelivery: 0,
      partiallyDelivered: 0,
      delivered: 0,
      cancelled: 0
    };

    // Map DB result to response
    results.forEach(r => {
      const status = r.eOrderStatus;
      const count = parseInt(r.get("count"));

      switch (status) {
        case 1:
          response.pending = count;
          break;
        case 2:
          response.confirmed = count;
          break;
        case 3:
          response.packaging = count;
          break;
        case 4:
          response.outForDelivery = count;
          break;
        case 5:
          response.partiallyDelivered = count;
          break;
        case 6:
          response.delivered = count;
          break;
        case 0:
          response.cancelled = count;
          break;
      }
    });

    return res.status(200).json({ success: true, data: response });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get pending orders list for a specific product
 */
exports.getPendingProductOrders = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const Token = jwt.Token;
    // Middleware handles permissions

    const { productId } = req.query;

    if (!productId)
      return res.status(400).json({ success: false, message: "Product ID is required." });

    const data = await OrderItem.findAll({
      where: {
        ItemId: productId,
        IsActive: true
      },
      include: [
        {
          model: Order,
          required: true,
          where: {
            // Pending, Confirmed, Packaging, Partially Delivered
            eOrderStatus: { [Op.in]: [1, 2, 3, 5] }
          },
          include: [
            {
              model: User,
              attributes: ["name", "mobile"]
            }
          ]
        },
        {
          model: Product,
          attributes: ["id", "name"]
        }
      ],
      order: [[col("Order.OrderDate"), "ASC"]]
    });

    const list = data.map(item => ({
      orderItemId: item.id,
      status: item.eStatus,
      deliveredQty: item.DeliveredQty,
      orderId: item.Order ? (item.Order.OrderNo || item.Order.id) : "-",
      orderDbId: item.Order?.id,
      customerName: item.Order?.User?.name || "Guest",
      customerPhone: item.Order?.User?.mobile || "—",
      qty: item.Qty,
      date: item.Order?.OrderDate
    }));

    return res.status(200).json({ success: true, data: list });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE ORDER ITEMS (ADMIN)
 * Update status and delivered quantity per item.
 */
exports.updateOrderItems = async (req, res) => {
  const transaction = await Sequelize.transaction();
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true) {
      await transaction.rollback();
      return res.status(400).json(jwt);
    }

    const Token = jwt.Token;
    // Middleware handles permissions

    const { orderId, items } = req.body;
    if (!orderId) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findByPk(orderId, {
      include: [OrderItem],
      transaction
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (Array.isArray(items)) {
      for (const u of items) {
        const item = order.OrderItems.find((oi) => oi.id === u.id);
        if (item) {
          const oldDeliveredQty = Number(item.DeliveredQty || 0);
          const newDeliveredQty = u.deliveredQty !== undefined ? Number(u.deliveredQty) : oldDeliveredQty;

          // Stock Deduction Logic
          if (newDeliveredQty !== oldDeliveredQty) {
            const diff = newDeliveredQty - oldDeliveredQty;
            const product = await Product.findByPk(item.ItemId, { transaction });

            if (product) {
              const currentStock = Number(product.Qty || 0);
              if (diff > 0 && currentStock < diff) {
                await transaction.rollback();
                return res.status(400).json({
                  success: false,
                  message: `Insufficient stock for ${product.name}. Available: ${currentStock}, Requested: ${diff}`
                });
              }

              // Update Product Stock
              product.Qty = currentStock - diff;
              await product.save({ transaction });
            }
          }

          if (u.deliveredQty !== undefined) item.DeliveredQty = u.deliveredQty;
          if (u.status !== undefined) item.eStatus = u.status;

          // Auto-infer status if deliveredQty is set but status isn't (or both)
          if (u.deliveredQty !== undefined) {
            const dQty = Number(u.deliveredQty);
            const oQty = Number(item.Qty);
            if (dQty >= oQty) item.eStatus = 6;
            else if (dQty > 0) item.eStatus = 5;
          }
          await item.save({ transaction });
        }
      }
    }

    await order.reload({ transaction });

    // Recalculate Order Status
    const itemStatuses = order.OrderItems.map((i) => Number(i.eStatus));
    const all6 = itemStatuses.every((s) => s === 6);
    const hasPartial = itemStatuses.some((s) => s === 5);
    const hasDelivered = itemStatuses.some((s) => s === 6);

    let nextStatus = order.eOrderStatus;

    if (all6) {
      nextStatus = 6; // Delivered
    } else if (hasPartial || (hasDelivered && !all6)) {
      nextStatus = 5; // Partially Delivered
    } else {
      // Majority Logic
      const counts = {};
      itemStatuses.forEach((s) => { counts[s] = (counts[s] || 0) + 1; });
      let maxFreq = 0;
      let majStatus = nextStatus;
      for (const [s, c] of Object.entries(counts)) {
        if (c > maxFreq) {
          maxFreq = c;
          majStatus = Number(s);
        }
      }
      nextStatus = majStatus;
    }

    if (order.eOrderStatus !== nextStatus) {
      order.eOrderStatus = nextStatus;
      await order.save({ transaction });
    }

    await transaction.commit();
    return res.status(200).json({ success: true, message: "Order items updated and stock adjusted" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UTILITY: Extract minimum Surface shipping charge from Nimbus courier list.
 * Checks ALL possible field names: service_type, mode, shipment_type, courier_type, type, courier_name
 * Always picks MINIMUM — never sums.
 */
function getMinSurfaceCharge(courierList) {
  if (!Array.isArray(courierList) || courierList.length === 0) {
    return { charge: 0, courierName: "N/A" };
  }


  // Step 1: Filter Surface options only
  const isSurface = (courier) => {
    const fieldsToCheck = [
      courier.service_type,
      courier.mode,
      courier.shipment_type,
      courier.courier_type,
      courier.type,
      courier.courier_name,
      courier.name
    ];
    return fieldsToCheck.some(field =>
      String(field || "").toLowerCase().includes("surface")
    );
  };

  const surfaceOptions = courierList.filter(isSurface);
  const targetOptions = surfaceOptions.length > 0 ? surfaceOptions : courierList;

  // Step 2: Map to structured objects and filter (Detecting Online/Offline differences)
  const mappedOptions = targetOptions
    .map(r => {
      // Prioritize 'total_charges' because it includes COD fees, GST and Fuel already calculated by the API.
      // Fallback to base freight + manual surcharge if total_charges is missing.
      const apiTotal = Number(r.total_charges ?? r.total_charge ?? 0) || 0;
      const baseFreight = Number(r.freight_charges ?? r.freight_charge ?? r.courier_charges ?? r.rate ?? 0) || 0;

      // Use API total if available, otherwise apply manual correction to base freight
      const adjustedCharge = apiTotal > 0 ? apiTotal : (baseFreight * 1.18) + 5;

      return {
        courierName: r.courier_name || r.name || "Unknown",
        charge: adjustedCharge,
        weight: r.chargeable_weight || r.weight || "N/A"
      };
    })
    .filter(c => c.charge > 0);

  if (mappedOptions.length === 0) {
    return { charge: 0, courierName: "N/A" };
  }

  // Step 3: Sort by charge (Ascending) and take the first (lowest)
  mappedOptions.sort((a, b) => a.charge - b.charge);

  const bestOption = mappedOptions[0];

  return {
    charge: Math.ceil(bestOption.charge),
    courierName: bestOption.courierName
  };
}

/**
 * GET SHIPPING CHARGES FROM NIMBUSPOST
 */
exports.getShippingCharges = async (req, res) => {
  try {
    const { pincode, items, paymentMethod, amount } = req.body;

    if (!pincode || !items || !items.length) {
      return res.status(400).json({ success: false, message: "Pincode and items are required" });
    }

    const productIds = items?.map(i => i.productId || i.id) || [];
    const products = await Product.findAll({ where: { id: { [Op.in]: productIds } } });

    // 1. Calculate Subtotal
    let subtotal = 0;
    items.forEach(item => {
      const p = products.find(prod => prod.id === (item.productId || item.id));
      if (p) {
        const price = (p.DiscountPrice && Number(p.DiscountPrice) < Number(p.Price)) ? Number(p.DiscountPrice) : Number(p.Price);
        subtotal += price * (item.quantity || item.qty || 1);
      }
    });

    // 2. Dynamic Weight Breakdown
    const { totalWeightKg } = nimbusService.buildShippingDetails(products, items);
    const weightGrams = Math.round(totalWeightKg * 1000); // Rule 6: grams

    let shippingCharge = 0;
    let courierName = "N/A";
    let apiSuccess = false;
    let errorDetail = null;

    // 3. Call Nimbus B2C Serviceability
    try {
      const nResponse = await nimbusService.checkServiceability(
        process.env.PICKUP_PINCODE || "474001",
        pincode,
        weightGrams, 
        paymentMethod || 'cod',
        subtotal
      );

      if (nResponse?.status && Array.isArray(nResponse.data)) {
        const best = nimbusService.getBestSurfaceRate(nResponse.data, weightGrams);
        if (best.charge > 0) {
          shippingCharge = best.charge;
          courierName = best.courierName;
          apiSuccess = true;
        } else {
          errorDetail = "No suitable courier found for this pincode.";
        }
      } else {
        errorDetail = nResponse?.message || "Serviceability check failed.";
      }
    } catch (nError) {
      errorDetail = nError.message;
    }

    if (!apiSuccess) {
      return res.status(200).json({ 
        success: false, 
        message: `Shipping Unavailable: ${errorDetail}`,
        subtotal,
        finalTotal: subtotal
      });
    }

    const finalTotal = subtotal + shippingCharge;

    return res.status(200).json({ 
      success: true, 
      subtotal,
      shippingCharge,
      charge: shippingCharge,
      finalTotal,
      courier: courierName,
      apiUsed: apiSuccess
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal shipping error: " + error.message });
  }
};
/**
 * GET ORDER TRACKING STATUS
 */
exports.getOrderTracking = async (req, res) => {
  try {
    const jwt = extractToken(req);
    if (jwt.success !== true)
      return res.status(401).json(jwt);

    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.ShipmentId) {
      return res.status(400).json({ success: false, message: "Order not shipped yet or Shipment ID missing" });
    }

    const trackingData = await nimbusService.getTracking(order.ShipmentId);

    return res.status(200).json({
      success: true,
      data: trackingData
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ADMIN: APPROVE ORDER
 * Explicit approval that triggers NimbusPost push
 */
exports.approveOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.ShipmentId) {
      return res.status(400).json({ success: false, message: "Order already pushed to Nimbus" });
    }

    // 1. Update status to Approved (2)
    order.eOrderStatus = 2;
    await order.save();

    // 2. Push to Nimbus
    try {
      const pushedOrder = await orderService.pushToNimbus(order.id);

      return res.status(200).json({
        success: true,
        message: "Order approved and pushed to Nimbus successfully",
        awbNumber: pushedOrder.ShipmentId,
        courierName: pushedOrder.CourierName,
        trackingId: pushedOrder.ShipmentId
      });

    } catch (pushError) {
      // Nimbus Push failed for approved order
      
      // If push fails, we stay at status 2 but return the error
      return res.status(200).json({
        success: false,
        message: `Order approved locally but Nimbus push failed: ${pushError.message}`,
        nimbusError: true
      });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TEST ROUTE: Manual Nimbus Test
 */
exports.testNimbus = async (req, res) => {
  try {
    
    // Test with default values
    const origin = process.env.PICKUP_PINCODE || "474001";
    const destination = "110001"; // Delhi test
    const weightGrams = 500; // 0.5 kg in grams
    
    const response = await nimbusService.checkServiceability(origin, destination, weightGrams, 'cod', 1000);
    
    return res.status(200).json({
      success: true,
      message: "Test completed.",
      rawResponse: response
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

