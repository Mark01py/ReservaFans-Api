const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

// Categorias deixaram de ser um ENUM fixo: o administrador pode cadastrar
// novas categorias pela interface (GET/POST /api/categorias).
class Category extends Model {}

Category.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, modelName: "Category", tableName: "categorias", timestamps: true }
);

module.exports = Category;
