const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Review = sequelize.define(
    "Review",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      customerName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      customerImage: {
        type: DataTypes.STRING,
        allowNull: true
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "reviews"
    }
  );

  return Review;
};
