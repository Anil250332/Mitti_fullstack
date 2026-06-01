const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const User = sequelize.define("User", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true
    },

    mobile: {
      type: DataTypes.STRING,
      allowNull: true
    },

    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    gstNo: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return User;
};
