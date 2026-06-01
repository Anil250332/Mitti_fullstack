const { Order, OrderItem, Category, Product, User, ProductImage } = require("../../models");
const Sequelize = require("../../config/db");

/**
 * DASHBOARD SUMMARY COUNTS
 */
exports.getDashboardCounts = async (req, res) => {
  try {
    const [totalOrders, totalCategories, totalProducts, totalCustomers] = await Promise.all([Order.count(), Category.count(), Product.count(), User.count()]);

    return res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalCategories,
        totalProducts,
        totalCustomers
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TOP 5 BEST SELLING PRODUCTS
 */
exports.getTopSellingProducts = async (req, res) => {
  try {
    const products = await OrderItem.findAll({
      attributes: [
        "ItemId",
        [Sequelize.fn("COUNT", Sequelize.col("OrderItem.id")), "orderCount"]
      ],
      group: ["ItemId"],
      order: [[Sequelize.literal("orderCount"), "DESC"]],
      limit: 5,
      include: [
        {
          model: Product,
          attributes: ["id", "name"],
          include: [
            {
              model: ProductImage,
              attributes: ["path"],
              limit: 1
            }
          ]
        }
      ]
    });

    const data = products
      .filter(p => p.Product) // Filter out items where Product is null
      .map(p => ({
        productName: p.Product?.name || "Unknown Product",
        image: p.Product?.ProductImages?.[0]?.path || null,
        totalOrders: parseInt(p.get("orderCount"))
      }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * TOP 6 CUSTOMERS BY ORDER AMOUNT
 */
exports.getTopCustomers = async (req, res) => {
  try {
    const customers = await Order.findAll({
      attributes: [
        "CustomerId",
        [Sequelize.fn("COUNT", Sequelize.col("Order.id")), "orderCount"],
        [Sequelize.fn("SUM", Sequelize.col("Amount")), "totalAmount"]
      ],
      group: ["CustomerId"],
      order: [[Sequelize.literal("totalAmount"), "DESC"]],
      limit: 6,
      include: [
        {
          model: User,
          attributes: ["name", "mobile"]
        }
      ]
    });

    const data = customers
      .filter(c => c.User) // Filter out items where User is null
      .map(c => ({
        customerName: c.User?.name || "Unknown Customer",
        phone: c.User?.mobile || "",
        orderCounts: parseInt(c.get("orderCount")),
        orderAmount: parseFloat(c.get("totalAmount"))
      }));

    return res.status(200).json({ success: true, data });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ORDER STATISTICS (CHART DATA)
 */
exports.getOrderStatistics = async (req, res) => {
  try {
    const range = req.query.range || "year";
    const { Op } = require("sequelize");

    const now = new Date();
    let startDate = new Date();
    let labels = [];

    if (range === "year") {
      startDate = new Date(now.getFullYear(), 0, 1); // Jan 1st
      labels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    } else if (range === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of month
      labels = ["W1", "W2", "W3", "W4", "W5"];
    } else if (range === "week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    }

    const orders = await Order.findAll({
      where: {
        OrderDate: {
          [Op.gte]: startDate
        },
        eOrderStatus: { [Op.ne]: 0 }
      },
      attributes: ["OrderDate", "Amount"]
    });

    const dataPoints = new Array(labels.length).fill(0);

    orders.forEach(o => {
      const d = new Date(o.OrderDate);
      const amount = Number(o.Amount) || 0;

      if (range === "year") {
        const month = d.getMonth();
        if (month >= 0 && month < 12) dataPoints[month] += amount;
      } else if (range === "month") {
        const date = d.getDate();
        let wIndex = Math.floor((date - 1) / 7);
        if (wIndex > 4) wIndex = 4;
        if (wIndex >= 0) dataPoints[wIndex] += amount;
      } else if (range === "week") {
        let day = d.getDay();
        let idx = day - 1;
        if (idx < 0) idx = 6;
        if (idx >= 0 && idx < 7) dataPoints[idx] += amount;
      }
    });

    const maxY = Math.max(...dataPoints, 100);
    const niceMaxY = Math.ceil(maxY / 1000) * 1000 || maxY;

    return res.status(200).json({
      success: true,
      data: {
        labels,
        values: dataPoints,
        maxY: niceMaxY
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};