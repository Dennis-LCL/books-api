const Sequelize = require("sequelize");

let sequelize;
const currentEnv = process.env.NODE_ENV || "development";

if (currentEnv === "production") {
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres"
  });
} else {
  // Create model instance
  sequelize = new Sequelize("books-api", "postgres", "123456", {
    dialect: "postgres"
  });
}

// Initialize models
const models = {
  Book: sequelize.import("./book"),
  Author: sequelize.import("./author")
};

// Setup relationship among models
Object.keys(models).forEach(key => {
  if ("associate" in models[key]) {
    models[key].associate(models);
  }
});

module.exports = { sequelize, ...models };
/*
The code under // Setup relationship among models comment
is doing the exact same thing as below code:

Author.associate(models)
Book.associate(models)
*/
