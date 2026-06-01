const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CartItem = sequelize.define("CartItem", {
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
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    }
  }, {
    tableName: "cartitems"
  });

  return CartItem;
};
