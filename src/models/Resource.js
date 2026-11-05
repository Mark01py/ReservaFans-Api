const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

class Resource extends Model {}

Resource.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    categoriaId: { type: DataTypes.INTEGER, allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: true },
    quantidadeTotal: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 0 } },
    fotoUrl: { type: DataTypes.STRING, allowNull: true },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: "Resource", tableName: "recursos", timestamps: true }
);

module.exports = Resource;
