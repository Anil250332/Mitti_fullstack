const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false
  }
);

// Test connection
sequelize.authenticate()
  .then(() => {
    // Database Connected Successfully
  })
  .catch((error) => {
    // Unable to connect
  });

module.exports = sequelize;
