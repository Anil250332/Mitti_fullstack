const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Permission = sequelize.define(
    "Permission",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      adminUserId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },

      pageKey: {
        type: DataTypes.STRING,
        allowNull: true
      },

      canView: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      }
    },
    {
      tableName: "permissions"
    }
  );

  return Permission;
};