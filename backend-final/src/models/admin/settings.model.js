const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Settings = sequelize.define("Settings", {
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    contactNo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    openingTime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    closingTime: {
      type: DataTypes.STRING,
      allowNull: true
    },
    TimeDetail1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    facebook: {
      type: DataTypes.STRING,
      allowNull: true
    },
    instagram: {
      type: DataTypes.STRING,
      allowNull: true
    },
    youtube: {
      type: DataTypes.STRING,
      allowNull: true
    },
    linkedin: {
      type: DataTypes.STRING,
      allowNull: true
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true
    }
  });

  return Settings;
};
