const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      category: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "categories"
    }
  );

  return Category;
};
