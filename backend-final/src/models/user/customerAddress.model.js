const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const CustomerAddress = sequelize.define("CustomerAddress", {
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false
    },
    state: {
      type: DataTypes.STRING,
      allowNull: false
    },
    country: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pincode: {
      type: DataTypes.STRING,
      allowNull: false
    }
  });

  CustomerAddress.associate = (models) => {
    CustomerAddress.belongsTo(models.User, {
      foreignKey: "userId"
    });
  };

  return CustomerAddress;
};
