const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductWeight = sequelize.define(
    "ProductWeight",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      ProductId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      TagId: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "productWeights"
    }
  );

  return ProductWeight;
};
