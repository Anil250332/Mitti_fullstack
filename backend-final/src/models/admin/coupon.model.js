const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Coupon = sequelize.define("Coupon", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        code: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM("flat", "percentage"),
            allowNull: false
        },
        value: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        minOrderAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        maxDiscountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        startDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expiryDate: {
            type: DataTypes.DATE,
            allowNull: false
        },
        usageLimit: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        usageCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isCodAllowed: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        },
        isOnlineAllowed: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: "coupons",
        timestamps: true
    });

    return Coupon;
};
