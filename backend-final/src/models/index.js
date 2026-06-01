const sequelize = require("../config/db");

const User = require("./user/user.model")(sequelize);
const Admin = require("./admin/admin.model")(sequelize);
const Permission = require("./admin/permission.model")(sequelize);
const Weight = require("./admin/weight.model")(sequelize);
const Tag = require("./admin/tag.model")(sequelize);
const Category = require("./admin/category.model")(sequelize);
const SubCategory = require("./admin/subcategory.model")(sequelize);
const Settings = require("./admin/settings.model")(sequelize);
const Contact = require("./contact.model")(sequelize);
const Coupon = require("./admin/coupon.model")(sequelize);
const Slider = require("./admin/slider.model")(sequelize);

const ProductImage = require("./admin/productImage.model")(sequelize);
const ProductWeight = require("./admin/productWeight.model")(sequelize);
const ProductTag = require("./admin/productTag.model")(sequelize);
const Product = require("./admin/product.model")(sequelize);
const Order = require("./admin/order.model")(sequelize);
const OrderItem = require("./admin/orderItem.model")(sequelize);
const Review = require("./admin/review.model")(sequelize);
const NimbusLog = require("./admin/nimbusLog.model")(sequelize);

// Check for undefined models immediately to catch import errors
const models = {
  User, Admin, Permission, Weight, Tag, Category, SubCategory,
  Product, Order, OrderItem, Settings, Contact, Coupon, Slider, Review, NimbusLog
};

Object.keys(models).forEach(modelName => {
  if (!models[modelName]) {
    throw new Error(`Model '${modelName}' failed to initialize.`);
  }
});



// User

const UserOtp = require("./user/userOtp.model")(sequelize);
const ProductWishlist = require("./user/wishlist.model")(sequelize);
const CartItem = require("./user/cartItem.model")(sequelize);
const CustomerAddress = require("./user/customerAddress.model")(sequelize);

// Validate secondary models
const secondaryModels = { ProductImage, ProductWeight, ProductTag, UserOtp, ProductWishlist, CartItem, CustomerAddress };
Object.keys(secondaryModels).forEach(modelName => {
  if (!secondaryModels[modelName]) {
    throw new Error(`Model '${modelName}' failed to initialize.`);
  }
});


// Relations

Product.belongsTo(Category, { foreignKey: "CategoryId" });
Product.belongsTo(SubCategory, { foreignKey: "SubCategoryId" });

SubCategory.belongsTo(Category, { foreignKey: "CategoryId" });
Category.hasMany(SubCategory, { foreignKey: "CategoryId" });
SubCategory.hasMany(Product, { foreignKey: "SubCategoryId" });

Product.hasMany(ProductImage, { foreignKey: "ProductId" });
Product.hasMany(ProductWeight, { foreignKey: "ProductId" });
Product.hasMany(ProductTag, { foreignKey: "ProductId" });

// Wishlist relations (for includes)
ProductWishlist.belongsTo(User, { foreignKey: "userId" });
ProductWishlist.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(ProductWishlist, { foreignKey: "productId" });

// Cart relations (for includes)
CartItem.belongsTo(User, { foreignKey: "userId" });
CartItem.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(CartItem, { foreignKey: "productId" });

OrderItem.belongsTo(Product, { foreignKey: "ItemId" });
Product.hasMany(OrderItem, { foreignKey: "ItemId" });

Order.belongsTo(User, { foreignKey: "CustomerId" });
User.hasMany(Order, { foreignKey: "CustomerId" });

Order.belongsTo(CustomerAddress, { foreignKey: "AddressId" });
CustomerAddress.hasMany(Order, { foreignKey: "AddressId" });

OrderItem.belongsTo(Order, { foreignKey: "OrderId" });
Order.hasMany(OrderItem, { foreignKey: "OrderId" });

ProductWeight.belongsTo(Weight, { foreignKey: "WeightId" });
ProductTag.belongsTo(Tag, { foreignKey: "TagId" });

Permission.belongsTo(Admin, { foreignKey: "adminUserId" });
Admin.hasMany(Permission, { foreignKey: "adminUserId", as: "permissions" });

Review.belongsTo(Product, { foreignKey: "productId" });
Product.hasMany(Review, { foreignKey: "productId" });

module.exports = {
  sequelize,
  User,
  Admin,
  Settings,
  Weight,
  Tag,
  Category,
  SubCategory,
  Product,
  ProductImage,
  ProductWeight,
  ProductTag,
  Permission,
  Order,
  OrderItem,


  UserOtp,
  ProductWishlist,
  CartItem,
  CustomerAddress,
  Contact,
  Coupon,
  Slider,
  Review,
  NimbusLog
};
