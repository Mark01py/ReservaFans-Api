const { DataTypes, Model } = require("sequelize");
const sequelize = require("../config/db");

const STATUS = ["ativa", "em_uso", "devolvida", "cancelada"];

class Reservation extends Model {}

Reservation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    dataInicio: { type: DataTypes.DATE, allowNull: false },
    dataFimPrevista: { type: DataTypes.DATE, allowNull: false },
    dataDevolucaoReal: { type: DataTypes.DATE, allowNull: true },
    status: { type: DataTypes.ENUM(...STATUS), allowNull: false, defaultValue: "ativa" },
    observacoes: { type: DataTypes.TEXT, allowNull: true },
  },
  {
    sequelize,
    modelName: "Reservation",
    tableName: "reservas",
    timestamps: true,
    validate: {
      periodoValido() {
        if (this.dataInicio && this.dataFimPrevista && this.dataInicio >= this.dataFimPrevista) {
          throw new Error("A data de devolucao prevista deve ser posterior a data de inicio.");
        }
      },
    },
  }
);

Reservation.STATUS = STATUS;

module.exports = Reservation;
