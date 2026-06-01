const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const OrderItem = sequelize.define("OrderItem", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    OrderId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },

    ItemId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },

    Qty: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },

    Price: {
      type: DataTypes.DECIMAL,
      allowNull: true
    },

    // 1=Pending, 2=Confirmed, 3=Packaging, 4=Out, 5=Partial, 6=Delivered
    eStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },

    DeliveredQty: {
      type: DataTypes.DECIMAL,
      allowNull: true,
      defaultValue: 0
    },

    IsActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    tableName: "orderItems"
  });

  return OrderItem;
};
