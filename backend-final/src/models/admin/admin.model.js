const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Admin = sequelize.define("Admin", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },

    email: {
      type: DataTypes.STRING,
      allowNull: true
    },

    phoneNo: {
      type: DataTypes.STRING,
      allowNull: true
    },

    username: {
      type: DataTypes.STRING,
      allowNull: true
    },

    password: {
      type: DataTypes.STRING,
      allowNull: true
    },

    isAdmin: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  });

  return Admin;
};
