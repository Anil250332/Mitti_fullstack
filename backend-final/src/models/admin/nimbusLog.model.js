const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const NimbusLog = sequelize.define("NimbusLog", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('login', 'check_serviceability', 'create_shipment', 'tracking'),
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requestPayload: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    responseData: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    success: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'nimbus_logs',
    timestamps: false
  });

  return NimbusLog;
};
