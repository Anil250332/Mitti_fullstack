const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Tag = sequelize.define(
    "Tag",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },

      tag: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "tags"
    }
  );

  return Tag;
};
