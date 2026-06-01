const {
  Order,
  OrderItem,
  Product,
  ProductImage,
  CustomerAddress,
  User,
  Coupon,
  CartItem
} = require("../models");

const { Op } = require("sequelize");

const nimbusService = require("./nimbus.service");

exports.createOrder = async ({ customerId, items, transactionId, addressId, couponCode, paymentMethod, paymentSlip }) => {
  // Fetch Address to get pincode for Shiprocket
  const address = await CustomerAddress.findByPk(addressId);
  if (!address) throw new Error("Delivery address not found.");

  // Fetch User
  const user = await User.findByPk(customerId);
  if (!user) throw new Error("User not found.");

  // Fetch Products to calculate weight and subtotal
  const productIds = items.map(i => i.productId);
  const products = await Product.findAll({
    where: { id: productIds }
  });

  const validatedItems = items.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    if (!p) throw new Error(`Product with ID ${item.productId} not found.`);

    const price = (p.DiscountPrice && Number(p.DiscountPrice) < Number(p.Price))
      ? Number(p.DiscountPrice)
      : Number(p.Price);

    return {
      productId: p.id,
      qty: item.qty,
      price: price
    };
  });

  const subtotal = validatedItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const { totalWeightKg } = nimbusService.buildShippingDetails(products, items);
  const totalWeightGrams = Math.round(totalWeightKg * 1000); // Rule 6: grams

  // Calculate discount if coupon
  let discountAmount = 0;
  let validatedCouponCode = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ where: { code: couponCode, isActive: true } });
    if (coupon) {
      if (paymentMethod === "COD" && !coupon.isCodAllowed) throw new Error("This coupon is only for Online Payment orders.");
      if (paymentMethod !== "COD" && !coupon.isOnlineAllowed) throw new Error("This coupon is only for COD orders.");
      
      // Check minimum order amount
      if (subtotal < coupon.minOrderAmount) {
        throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`);
      }

      discountAmount = (coupon.type === "percentage") ? (subtotal * coupon.value) / 100 : coupon.value;
      validatedCouponCode = coupon.code;
    }
  }

  const taxAmount = 0;
  let deliveryCharges = 0;
  try {
    const nimbusResponse = await nimbusService.checkServiceability(
      process.env.PICKUP_PINCODE || "474001",
      address.pincode,
      totalWeightGrams,
      paymentMethod,
      subtotal
    );
    if (nimbusResponse?.status && Array.isArray(nimbusResponse.data)) {
      const best = nimbusService.getBestSurfaceRate(nimbusResponse.data, totalWeightGrams);
      if (best.charge > 0) {
        deliveryCharges = best.charge;
      } else {
        throw new Error("No suitable shipping method found for this location.");
      }
    } else {
      throw new Error(nimbusResponse?.message || "Shipping serviceability check failed.");
    }
  } catch (err) {
    throw new Error(`Shipping Error: ${err.message}. Please try again later.`);
  }

  const finalAmount = Math.max(0, subtotal - discountAmount + taxAmount + deliveryCharges);

  const isPaid = (paymentMethod !== "COD" && transactionId);

  const order = await Order.create({
    OrderNo: `ORD-${Date.now()}`,
    OrderDate: new Date(),
    CustomerId: customerId,
    Amount: finalAmount,
    PaidAmount: isPaid ? finalAmount : 0,
    ePaymentStatus: isPaid ? 2 : 0,
    eOrderStatus: 1,
    TransactionId: transactionId || null,
    AddressId: addressId,
    CouponCode: validatedCouponCode,
    DiscountAmount: discountAmount,
    TaxAmount: taxAmount,
    DeliveryCharges: deliveryCharges,
    PaymentMethod: paymentMethod || "COD",
    paymentSlip: paymentSlip || null
  });


  const orderItems = validatedItems.map(i => ({
    OrderId: order.id,
    ItemId: i.productId,
    Qty: i.qty,
    Price: i.price,
    IsActive: true
  }));

  await OrderItem.bulkCreate(orderItems);

  await CartItem.destroy({ where: { userId: customerId } });

  return order;
};

/**
 * Push an existing order to NimbusPost (to be called when admin approves or auto-push for COD)
 */
exports.pushToNimbus = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: User },
        { model: CustomerAddress },
        {
          model: OrderItem,
          include: [{ model: Product }]
        }
      ]
    });

    if (!order) throw new Error("Order not found");
    // Only push if not already pushed
    if (order.ShipmentId) return order;

    const user = order.User;
    const address = order.CustomerAddress;
    if (!address) throw new Error("Delivery address missing for shipment");

    // Get products and calculate dynamic weight & details
    const productsList = order.OrderItems.map(item => item.Product).filter(Boolean);
    const cartItems = order.OrderItems.map(item => ({ productId: item.ItemId, quantity: item.Qty }));
    const { totalWeightKg } = nimbusService.buildShippingDetails(productsList, cartItems);
    const weightGrams = Math.round(totalWeightKg * 1000); // Rule 6: weight = number (grams)


    // Select lowest courier
    const origin = process.env.PICKUP_PINCODE || "474001";
    let courierId = "";
    let selectedCourierName = "Standard Shipping";

    try {
      const resp = await nimbusService.checkServiceability(
        origin, 
        address.pincode, 
        weightGrams, 
        order.PaymentMethod || "COD", 
        order.Amount
      );
      if (resp?.status && Array.isArray(resp.data)) {
        const best = nimbusService.getBestSurfaceRate(resp.data, totalWeightKg);
        if (best.charge > 0) {
          courierId = resp.data.find(c => (c.name || c.courier_name) === best.courierName)?.id || "";
          selectedCourierName = best.courierName;
        }
      }
    } catch (e) {
      // B2C Serviceability error during push
    }

    const rawPhone = user?.mobile || address.phone || "9999999999";
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    // Dynamic products array for B2C
    const b2cProducts = order.OrderItems.map(item => ({
      name: item.Product?.name || "Product",
      qty: item.Qty,
      price: Number(item.Price),
      sku: `PROD-${item.ItemId}`
    }));

    // Construct Clean B2C Payload as per latest Nimbus API requirements (Rule 1, 2, 3)
    const b2cPayload = {
      order_number: order.OrderNo,
      order_date: order.OrderDate.toISOString().split('T')[0],
      payment_type: (order.PaymentMethod === "COD") ? "cod" : "prepaid",
      order_amount: Number(order.Amount), // Rule 1: order_value -> order_amount
      cod_amount: (order.PaymentMethod === "COD") ? Number(order.Amount) : 0, 
      consignee: {
        name: user?.name || "Customer",
        email: user?.email || "customer@example.com",
        phone: cleanPhone,
        address: address.address,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
      },
      pickup: { // Rule 2: Full pickup details
        warehouse_name: process.env.NIMBUS_PICKUP_LOCATION || "Home",
        name: process.env.NIMBUS_PICKUP_NAME || "Priyanka Kaurav",
        phone: process.env.NIMBUS_PICKUP_PHONE || "9999999999",
        address: process.env.NIMBUS_PICKUP_ADDRESS || "Full Warehouse Address Example",
        city: process.env.NIMBUS_PICKUP_CITY || "Gwalior",
        state: process.env.NIMBUS_PICKUP_STATE || "Madhya Pradesh",
        pincode: process.env.PICKUP_PINCODE || "474001"
      },
      courier_id: courierId || "",
      package_weight: weightGrams, // Rule 1 & 3
      package_length: 10,
      package_breadth: 10,
      package_height: 10,
      order_items: b2cProducts, // Rule 1: products -> order_items
      is_insurance: "0" // Rule 3
    };

    const nimbusResponse = await nimbusService.createShipment(b2cPayload);

    if (nimbusResponse && nimbusResponse.status) {
      // Save response details
      order.ShiprocketOrderId = nimbusResponse.data.id || nimbusResponse.data.shipment_id;
      order.ShipmentId = nimbusResponse.data.awb_number || nimbusResponse.data.tracking_number;
      order.CourierName = nimbusResponse.data.courier_name || selectedCourierName; 
      await order.save();
    } else {
      const msg = nimbusResponse?.message || JSON.stringify(nimbusResponse);
      throw new Error(msg);
    }
    return order;
  } catch (err) {
    throw err;
  }
};

exports.getOrdersByCustomer = async (customerId, { page = 1, limit = 10 } = {}) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Order.findAndCountAll({
    where: { CustomerId: customerId },
    include: [
      {
        model: User,
        attributes: ["id", "name", "companyName", "mobile"]
      },
      {
        model: CustomerAddress,
        required: false
      },
      {
        model: OrderItem,
        include: [
          {
            model: Product,
            attributes: ["id", "name", "Price", "PacketsPerJar"],
            include: [
              {
                model: ProductImage,
                attributes: ["Path"],
                limit: 1,
                separate: true
              }
            ]
          }
        ]
      }
    ],
    offset,
    limit,
    order: [["OrderDate", "DESC"]],
    distinct: true
  });
  return { count, rows };
};

exports.getAdminOrders = async ({ page, limit, search }) => {
  const offset = (page - 1) * limit;

  const where = {};

  if (search) {
    where[Op.or] = [
      { OrderNo: { [Op.like]: `%${search}%` } },
      { "$User.name$": { [Op.like]: `%${search}%` } }
    ];
  }

  const { count, rows } = await Order.findAndCountAll({
    where,
    include: [
      {
        model: User,
        attributes: ["id", "name", "mobile"]
      },
      {
        model: OrderItem,
        include: [
          {
            model: Product,
            attributes: ["id", "name"]
          }
        ]
      },
      {
        model: CustomerAddress
      }
    ],
    offset,
    limit,
    order: [["OrderDate", "DESC"]],
    distinct: true
  });

  return { count, rows };
};

exports.getOrderById = async (id) => {
  return Order.findByPk(id, {
    include: [
      { model: User },
      { model: CustomerAddress },
      {
        model: OrderItem,
        include: [{ model: Product }]
      }
    ]
  });
};
