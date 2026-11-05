const sequelize = require("../config/db");
const User = require("./User");
const Resource = require("./Resource");
const Reservation = require("./Reservation");
const Category = require("./Category");

User.hasMany(Reservation, { foreignKey: "userId", as: "reservas" });
Reservation.belongsTo(User, { foreignKey: "userId", as: "usuario" });

Resource.hasMany(Reservation, { foreignKey: "resourceId", as: "reservas" });
Reservation.belongsTo(Resource, { foreignKey: "resourceId", as: "recurso" });

Category.hasMany(Resource, { foreignKey: "categoriaId", as: "recursos" });
Resource.belongsTo(Category, { foreignKey: "categoriaId", as: "categoriaRef" });

module.exports = { sequelize, User, Resource, Reservation, Category };
