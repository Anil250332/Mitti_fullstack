const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductTag = sequelize.define(
    "ProductTag",
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
      tableName: "productTags"
    }
  );

  return ProductTag;
};
