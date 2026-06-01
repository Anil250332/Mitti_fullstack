const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductWishlist = sequelize.define("ProductWishlist", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    productId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: "productwishlists"
  });

  return ProductWishlist;
};
