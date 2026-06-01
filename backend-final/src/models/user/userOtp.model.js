const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return UserOTP = sequelize.define("UserOtp", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        userId: {
            type: DataTypes.INTEGER,
            allowNull: true
        },

        phoneNo: {
            type: DataTypes.STRING,
            allowNull: true
        },

        otp: {
            type: DataTypes.STRING,
            allowNull: true
        },

        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true
        },

        isUsed: {
            type: DataTypes.BOOLEAN,
            allowNull: true
        }
    });
};
