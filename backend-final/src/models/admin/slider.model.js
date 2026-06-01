const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Slider = sequelize.define(
        "Slider",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },
            type: {
                type: DataTypes.ENUM("image", "video"),
                allowNull: false,
                defaultValue: "image"
            },
            url: {
                type: DataTypes.STRING,
                allowNull: false
            },
            order: {
                type: DataTypes.INTEGER,
                allowNull: true,
                defaultValue: 0
            },
            isActive: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            }
        },
        {
            tableName: "sliders"
        }
    );

    return Slider;
};
