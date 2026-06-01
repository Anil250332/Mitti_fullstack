const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductImage = sequelize.define(
    "ProductImage",
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

      GUID: {
        type: DataTypes.STRING,
        allowNull: true
      },

      Path: {
        type: DataTypes.STRING,
        allowNull: true
      },

      eExtension: {
        type: DataTypes.INTEGER,
        allowNull: true
      }
    },
    {
      tableName: "productImages"
    }
  );

  return ProductImage;
};
