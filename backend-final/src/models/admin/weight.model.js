const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Weight = sequelize.define("Weight", {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },

    weight: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: "weights"
  });

  return Weight;
};
