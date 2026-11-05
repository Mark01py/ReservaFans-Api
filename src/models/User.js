const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class User extends Model {}

User.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
    senhaHash: { type: DataTypes.STRING, allowNull: false },
    perfil: { type: DataTypes.ENUM("usuario", "admin"), allowNull: false, defaultValue: "usuario" },
  },
  { sequelize, modelName: "User", tableName: "usuarios", timestamps: true }
);

module.exports = User;
