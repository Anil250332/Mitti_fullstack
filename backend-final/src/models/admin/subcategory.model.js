const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SubCategory = sequelize.define(
    "SubCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      CategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "subcategories"
    }
  );

  return SubCategory;
};
